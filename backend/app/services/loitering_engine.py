from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone
import logging
import threading
import time
from typing import Any, Dict, List, Optional, Tuple

import cv2
import numpy as np

from app.core.config import settings

logger = logging.getLogger("siloter.loitering_engine")


@dataclass
class TrackLoiteringState:
    """State tracking for a single vehicle inside a camera view."""

    track_id: str
    raw_track_id: Optional[int]
    first_seen_inside: float
    last_seen_inside: float
    duration_seconds: int = 0
    inside_roi: bool = False
    is_violation: bool = False
    is_captured: bool = False  # Single-capture lock per loitering cycle (AGENTS.md Rule 11)
    event_id: Optional[str] = None  # DB violation_events.id for real-time synchronization
    last_synced_duration: int = 0  # Last duration_seconds synced to DB and WebSocket clients
    last_anchor: Tuple[int, int] = (0, 0)
    last_bbox: List[float] = field(default_factory=list)
    confidence: float = 0.0
    missed_frames: int = 0  # Consecutive absent frames for occlusion grace period
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass
class LoiteringEvaluationResult:
    """Output bundle containing annotated frame and detected violation events."""

    annotated_frame: np.ndarray
    tracked_states: List[TrackLoiteringState]
    active_violations: List[TrackLoiteringState]
    new_violations: List[TrackLoiteringState]  # Triggered in this exact frame cycle for Auto-Capture
    roi_pixel_polygon: np.ndarray
    duration_updates: List[TrackLoiteringState] = field(default_factory=list)  # Heartbeat duration updates
    departed_violations: List[TrackLoiteringState] = field(default_factory=list)  # Violations that finished loitering


class LoiteringEngine:
    """
    Spatio-Temporal Loitering Detection Engine.
    Evaluates vehicle presence inside Region of Interest (ROI) polygons,
    accumulates stationary duration at 1 FPS, tolerates micro-movement,
    handles occlusion grace periods, and produces command-center visual overlays.
    """

    def __init__(
        self,
        default_threshold_seconds: int = 60,
        max_grace_seconds: int = 5,
    ):
        self.default_threshold_seconds = default_threshold_seconds
        self.max_grace_seconds = max_grace_seconds
        # camera_code -> { track_id -> TrackLoiteringState }
        self.vehicle_timers: Dict[str, Dict[str, TrackLoiteringState]] = defaultdict(dict)
        self._lock = threading.Lock()

    # ==========================================================================
    # 1. ROI DENORMALIZATION & ANCHOR EVALUATION
    # ==========================================================================

    @staticmethod
    def denormalize_roi(
        roi_polygon: List[List[float]],
        width: int,
        height: int,
    ) -> np.ndarray:
        """
        Converts normalized relative coordinates [0.0 - 1.0] from camera config
        into actual integer pixel coordinates based on frame dimensions (width x height).
        Returns an int32 polygon contour of shape (N, 1, 2) suitable for OpenCV.
        """
        if not roi_polygon or len(roi_polygon) < 3:
            return np.empty((0, 1, 2), dtype=np.int32)

        pts = []
        for vertex in roi_polygon:
            x_norm, y_norm = vertex[0], vertex[1]
            x_px = int(round(x_norm * width))
            y_px = int(round(y_norm * height))
            # Clamp to frame boundaries
            x_px = max(0, min(x_px, width - 1))
            y_px = max(0, min(y_px, height - 1))
            pts.append([x_px, y_px])

        return np.array(pts, dtype=np.int32).reshape((-1, 1, 2))

    @staticmethod
    def calculate_bottom_center_anchor(bbox: List[float]) -> Tuple[int, int]:
        """
        Calculates bottom-center anchor point:
        cx = (x1 + x2) / 2, cy = y2
        """
        x1, y1, x2, y2 = bbox
        cx = int(round((x1 + x2) / 2.0))
        cy = int(round(y2))
        return cx, cy

    @staticmethod
    def is_point_inside_roi(anchor: Tuple[int, int], roi_contour: np.ndarray) -> bool:
        """
        Evaluates whether anchor (cx, cy) is strictly inside or on the edge of the ROI.
        cv2.pointPolygonTest returns:
            > 0: inside polygon
            = 0: on edge
            < 0: outside polygon
        """
        if roi_contour.size == 0 or len(roi_contour) < 3:
            return False

        dist = cv2.pointPolygonTest(roi_contour, (float(anchor[0]), float(anchor[1])), False)
        return dist >= 0

    # ==========================================================================
    # 2. CORE EVALUATION CYCLE (1 FPS SPATIO-TEMPORAL LOGIC)
    # ==========================================================================

    def process_frame(
        self,
        camera_code: str,
        frame: np.ndarray,
        detections: List[Dict[str, Any]],
        roi_polygon: List[List[float]],
        threshold_seconds: Optional[int] = None,
    ) -> LoiteringEvaluationResult:
        """
        Processes a single 1 FPS video frame:
        1. Denormalizes ROI.
        2. Evaluates anchor points for all detected objects.
        3. Updates timers with micro-movement tolerance and occlusion grace periods.
        4. Detects new violations and renders high-contrast control room annotations.
        """
        h, w = frame.shape[:2]
        effective_threshold = threshold_seconds or self.default_threshold_seconds
        roi_contour = self.denormalize_roi(roi_polygon, w, h)
        current_time = time.time()

        active_track_ids_this_frame = set()
        new_violations: List[TrackLoiteringState] = []
        duration_updates: List[TrackLoiteringState] = []
        departed_violations: List[TrackLoiteringState] = []
        annotated_frame = frame.copy()

        with self._lock:
            camera_timers = self.vehicle_timers[camera_code]

            # A. Process all vehicles detected in the current frame
            for det in detections:
                track_id = det["track_id"]
                raw_id = det.get("raw_track_id")
                bbox = det["bbox"]
                conf = det.get("confidence", 0.0)

                # Skip untracked objects
                if not track_id or track_id == "Angkot_Untracked":
                    continue

                active_track_ids_this_frame.add(track_id)
                anchor = self.calculate_bottom_center_anchor(bbox)
                inside = self.is_point_inside_roi(anchor, roi_contour)

                if inside:
                    if track_id in camera_timers:
                        state = camera_timers[track_id]
                        # 1 FPS Strict Increment: Add +1 second
                        state.duration_seconds += 1
                        state.last_seen_inside = current_time
                        state.inside_roi = True
                        state.missed_frames = 0
                        state.last_anchor = anchor
                        state.last_bbox = bbox
                        state.confidence = conf

                        # Check violation threshold
                        if state.duration_seconds >= effective_threshold:
                            state.is_violation = True
                            if not state.is_captured:
                                # First time exceeding threshold -> trigger Auto-Capture!
                                state.is_captured = True
                                state.last_synced_duration = state.duration_seconds
                                new_violations.append(state)
                                logger.warning(
                                    f"[{camera_code}] VIOLATION TRIGGERED: {track_id} "
                                    f"loitering for {state.duration_seconds}s (threshold: {effective_threshold}s)"
                                )
                            else:
                                # Vehicle continues loitering: trigger periodic heartbeat update (every 5 seconds)
                                if state.event_id and (state.duration_seconds - state.last_synced_duration >= 5):
                                    state.last_synced_duration = state.duration_seconds
                                    duration_updates.append(state)
                    else:
                        # First observation inside ROI
                        new_state = TrackLoiteringState(
                            track_id=track_id,
                            raw_track_id=raw_id,
                            first_seen_inside=current_time,
                            last_seen_inside=current_time,
                            duration_seconds=1,  # Initial 1st second
                            inside_roi=True,
                            is_violation=(1 >= effective_threshold),
                            is_captured=False,
                            last_synced_duration=0,
                            last_anchor=anchor,
                            last_bbox=bbox,
                            confidence=conf,
                            missed_frames=0,
                        )
                        camera_timers[track_id] = new_state
                        if new_state.is_violation and not new_state.is_captured:
                            new_state.is_captured = True
                            new_state.last_synced_duration = 1
                            new_violations.append(new_state)
                else:
                    # Vehicle is OUTSIDE ROI
                    if track_id in camera_timers:
                        state = camera_timers[track_id]
                        state.inside_roi = False
                        state.last_anchor = anchor
                        state.last_bbox = bbox
                        state.confidence = conf
                        state.missed_frames += 1

                        # Reset timer if it stays outside beyond grace period
                        if state.missed_frames > self.max_grace_seconds:
                            if state.is_captured and state.event_id:
                                logger.info(
                                    f"[{camera_code}] Vehicle {track_id} departed ROI. "
                                    f"Final loitering duration: {state.duration_seconds}s"
                                )
                                departed_violations.append(state)
                            del camera_timers[track_id]

            # B. Handle vehicles NOT detected in this frame (Occlusion Grace Period)
            absent_track_ids = [tid for tid in camera_timers if tid not in active_track_ids_this_frame]
            for tid in absent_track_ids:
                state = camera_timers[tid]
                state.missed_frames += 1

                # If missing longer than grace period (e.g., 5 seconds), expire session
                if state.missed_frames > self.max_grace_seconds:
                    logger.debug(
                        f"[{camera_code}] {tid} expired after {state.missed_frames} absent frames. Timer reset."
                    )
                    if state.is_captured and state.event_id:
                        logger.info(
                            f"[{camera_code}] Vehicle {tid} tracking lost. "
                            f"Final loitering duration: {state.duration_seconds}s"
                        )
                        departed_violations.append(state)
                    del camera_timers[tid]

            # Collect active list
            all_states = list(camera_timers.values())
            active_violations = [s for s in all_states if s.is_violation]

        # ======================================================================
        # 3. COMMAND-CENTER OPENCV VISUAL ANNOTATIONS
        # ======================================================================
        self._render_annotations(
            annotated_frame,
            detections,
            camera_timers,
            roi_contour,
            effective_threshold,
        )

        return LoiteringEvaluationResult(
            annotated_frame=annotated_frame,
            tracked_states=all_states,
            active_violations=active_violations,
            new_violations=new_violations,
            duration_updates=duration_updates,
            departed_violations=departed_violations,
            roi_pixel_polygon=roi_contour,
        )

    # ==========================================================================
    # 4. DRAWING & OVERLAY RENDERING
    # ==========================================================================

    def _render_annotations(
        self,
        frame: np.ndarray,
        detections: List[Dict[str, Any]],
        timers: Dict[str, TrackLoiteringState],
        roi_contour: np.ndarray,
        threshold_seconds: int,
    ) -> None:
        """
        Draws semi-transparent ROI polygon and color-coded bounding boxes on frame:
        - Green: Outside ROI
        - Amber/Yellow: Inside ROI, duration < threshold
        - Red: Inside ROI, duration >= threshold (LOITERING)
        """
        h, w = frame.shape[:2]

        # 1. Render Semi-Transparent ROI Polygon
        if roi_contour.size > 0 and len(roi_contour) >= 3:
            overlay = frame.copy()
            # Fill ROI with soft translucent amber/yellow (BGR: 0, 180, 255)
            cv2.fillPoly(overlay, [roi_contour], (0, 160, 240))
            cv2.addWeighted(overlay, 0.22, frame, 0.78, 0, frame)

            # Draw solid yellow contour boundary
            cv2.polylines(frame, [roi_contour], isClosed=True, color=(0, 215, 255), thickness=2, lineType=cv2.LINE_AA)

            # Draw ROI Title banner on the topmost vertex
            top_vertex = min(roi_contour, key=lambda pt: pt[0][1])[0]
            label_x = max(10, min(top_vertex[0], w - 300))
            label_y = max(25, top_vertex[1] - 8)
            cv2.putText(
                frame,
                f"ZONA DILARANG MENGETEM (T_max = {threshold_seconds}s)",
                (label_x, label_y),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                (0, 240, 255),
                2,
                cv2.LINE_AA,
            )

        # 2. Render Vehicle Bounding Boxes and Status Badges
        for det in detections:
            track_id = det["track_id"]
            x1, y1, x2, y2 = [int(v) for v in det["bbox"]]
            anchor = (int(round((x1 + x2) / 2.0)), y2)

            state = timers.get(track_id)
            duration = state.duration_seconds if state else 0
            is_inside = state.inside_roi if state else False

            # Determine color and text label
            if is_inside and duration >= threshold_seconds:
                # Merah Terang (Red) - Active Loitering Violation!
                color = (0, 0, 255)  # BGR
                box_thickness = 3
                badge_text = f"[LOITERING] {track_id} | {duration}s"
                text_bg_color = (0, 0, 220)
            elif is_inside:
                # Kuning / Oranye (Amber) - Monitoring inside ROI
                color = (0, 190, 255)  # BGR
                box_thickness = 2
                badge_text = f"{track_id} | {duration}s"
                text_bg_color = (0, 140, 200)
            else:
                # Hijau (Green) - Outside ROI / Normal flow
                color = (0, 220, 0)  # BGR
                box_thickness = 2
                badge_text = f"{track_id}"
                text_bg_color = (0, 150, 0)

            # Draw bounding box
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, box_thickness, cv2.LINE_AA)

            # Draw anchor point circle at bottom-center
            cv2.circle(frame, anchor, 5, color, -1, cv2.LINE_AA)
            cv2.circle(frame, anchor, 7, (255, 255, 255), 1, cv2.LINE_AA)

            # Draw text label with solid background for sharp readability
            font_scale = 0.52
            font_thick = 1
            (text_w, text_h), baseline = cv2.getTextSize(badge_text, cv2.FONT_HERSHEY_SIMPLEX, font_scale, font_thick)

            badge_y1 = max(0, y1 - text_h - 8)
            badge_y2 = y1
            badge_x2 = min(w, x1 + text_w + 10)

            cv2.rectangle(frame, (x1, badge_y1), (badge_x2, badge_y2), text_bg_color, -1)
            cv2.putText(
                frame,
                badge_text,
                (x1 + 5, y1 - 4),
                cv2.FONT_HERSHEY_SIMPLEX,
                font_scale,
                (255, 255, 255),
                font_thick,
                cv2.LINE_AA,
            )

    def reset_camera_state(self, camera_code: str) -> None:
        """Clears all tracking timers for a given camera."""
        with self._lock:
            if camera_code in self.vehicle_timers:
                self.vehicle_timers[camera_code].clear()
                logger.info(f"[{camera_code}] Loitering timers reset.")

    def get_camera_states(self, camera_code: str) -> List[Dict[str, Any]]:
        """Returns serialized status of all active vehicles for a camera."""
        with self._lock:
            states = self.vehicle_timers.get(camera_code, {})
            return [
                {
                    "track_id": s.track_id,
                    "duration_seconds": s.duration_seconds,
                    "inside_roi": s.inside_roi,
                    "is_violation": s.is_violation,
                    "is_captured": s.is_captured,
                    "missed_frames": s.missed_frames,
                    "confidence": s.confidence,
                }
                for s in states.values()
            ]


# Application-wide global loitering engine instance
loitering_engine = LoiteringEngine(
    default_threshold_seconds=settings.DEFAULT_THRESHOLD_SECONDS,
    max_grace_seconds=settings.OCCLUSION_GRACE_SECONDS,
)

