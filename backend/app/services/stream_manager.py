from datetime import datetime, timezone
import logging
from pathlib import Path
import threading
import time
from typing import Dict, List, Optional, Tuple

import cv2
import numpy as np

from app.core.config import settings, BASE_DIR
from app.schemas.payload_schemas import CameraCode, CameraStatus

logger = logging.getLogger("siloter.stream_manager")


class CameraStreamWorker:
    """
    Independent worker thread responsible for acquiring video frames from a single CCTV camera.
    Supports HLS (.m3u8) streams from BSW Kota Bogor with strict 1 FPS throttling,
    automatic reconnection via exponential backoff, and local .mp4 video fallback with looping.
    Fault-isolated: failure in this worker does not affect other camera streams (NFR-02).
    """

    def __init__(
        self,
        camera_code: str,
        camera_name: str,
        stream_url: Optional[str] = None,
        fallback_path: Optional[str] = None,
        default_width: int = 1920,
        default_height: int = 1080,
        target_fps: float = 1.0,
        max_hls_retries: int = 3,
        initial_backoff: float = 1.0,
        max_backoff: float = 30.0,
    ):
        self.camera_code = camera_code
        self.camera_name = camera_name
        self.stream_url = stream_url
        self.fallback_path = fallback_path
        self.target_fps = target_fps
        self.target_interval = 1.0 / target_fps if target_fps > 0 else 1.0
        self.max_hls_retries = max_hls_retries
        self.initial_backoff = initial_backoff
        self.max_backoff = max_backoff

        # Dynamic frame dimensions (denormalization reference)
        self.width: int = default_width
        self.height: int = default_height

        # ROI & Loitering Configuration
        self.roi_polygon: List[List[float]] = []
        self.threshold_seconds: int = 60
        self.is_configured: bool = False

        # Live Real-Time Analytics
        self.detected_vehicles_count: int = 0
        self.inside_roi_count: int = 0
        self.active_violations_count: int = 0

        # Operational state
        self.status: CameraStatus = CameraStatus.OFFLINE
        self.current_source: Optional[str] = None
        self.frame_count: int = 0
        self.last_frame_timestamp: Optional[datetime] = None
        self.current_fps: float = 0.0

        # Concurrency primitives
        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None
        self._frame_lock = threading.Lock()
        self._latest_frame: Optional[np.ndarray] = None
        self._latest_annotated_frame: Optional[np.ndarray] = None
        self._fps_window: List[float] = []

    def start(self) -> None:
        """Starts the camera acquisition thread if not already running."""
        if self._thread is not None and self._thread.is_alive():
            logger.warning(f"[{self.camera_code}] Worker is already running.")
            return

        self._stop_event.clear()
        self._thread = threading.Thread(
            target=self._worker_loop,
            name=f"Worker-{self.camera_code}",
            daemon=True,
        )
        self._thread.start()
        logger.info(f"[{self.camera_code}] Worker thread started.")

    def stop(self, timeout: float = 5.0) -> None:
        """Signals the worker thread to terminate and waits for completion."""
        logger.info(f"[{self.camera_code}] Stopping worker thread...")
        self._stop_event.set()
        if self._thread is not None and self._thread.is_alive():
            self._thread.join(timeout=timeout)
        self.status = CameraStatus.OFFLINE
        logger.info(f"[{self.camera_code}] Worker stopped successfully.")

    def get_latest_frame(self) -> Tuple[Optional[np.ndarray], Optional[datetime], CameraStatus]:
        """
        Thread-safe retrieval of the most recent frame and its capture timestamp.
        Returns a tuple: (frame_bgr, timestamp, status).
        """
        with self._frame_lock:
            if self._latest_frame is not None:
                return self._latest_frame.copy(), self.last_frame_timestamp, self.status
            return None, self.last_frame_timestamp, self.status

    def get_latest_annotated_frame(self) -> Tuple[Optional[np.ndarray], Optional[datetime], CameraStatus]:
        """
        Thread-safe retrieval of the latest frame enriched with ROI and bounding box overlays.
        Used for streaming MJPEG directly to Next.js <img> components.
        """
        with self._frame_lock:
            if self._latest_annotated_frame is not None:
                return self._latest_annotated_frame.copy(), self.last_frame_timestamp, self.status
            elif self._latest_frame is not None:
                return self._latest_frame.copy(), self.last_frame_timestamp, self.status
            # If no frame available yet, generate clean control-room placeholder
            placeholder = self._generate_placeholder_frame("Connecting to stream...")
            return placeholder, self.last_frame_timestamp, self.status

    def update_config(
        self,
        roi_polygon: Optional[List[List[float]]] = None,
        threshold_seconds: Optional[int] = None,
        stream_url: Optional[str] = None,
        is_configured: Optional[bool] = None,
    ) -> None:
        """Dynamically updates ROI polygon and stationary thresholds on-the-fly."""
        with self._frame_lock:
            if roi_polygon is not None:
                self.roi_polygon = roi_polygon
            if threshold_seconds is not None:
                self.threshold_seconds = threshold_seconds
            if stream_url is not None:
                self.stream_url = stream_url
            if is_configured is not None:
                self.is_configured = is_configured
            logger.info(f"[{self.camera_code}] Camera configuration updated on-the-fly.")

    def get_info(self) -> dict:
        """Returns metadata and real-time operational metrics for this camera."""
        with self._frame_lock:
            return {
                "camera_code": self.camera_code,
                "camera_name": self.camera_name,
                "status": self.status.value,
                "is_fallback": self.status == CameraStatus.FALLBACK_MODE,
                "resolution": {"width": self.width, "height": self.height},
                "fps": round(self.current_fps, 2),
                "frames_extracted": self.frame_count,
                "last_frame_time": self.last_frame_timestamp.isoformat() if self.last_frame_timestamp else None,
                "source": self.current_source,
                "detected_vehicles_count": self.detected_vehicles_count,
                "inside_roi_count": self.inside_roi_count,
                "active_violations_count": self.active_violations_count,
                "threshold_seconds": self.threshold_seconds,
                "roi_polygon": self.roi_polygon,
                "is_configured": self.is_configured,
            }

    # ==========================================================================
    # COORDINATE DENORMALIZATION HELPERS (Section 10 of ARCHITECTURE.md)
    # ==========================================================================

    def denormalize_point(self, x_norm: float, y_norm: float) -> Tuple[int, int]:
        """
        Converts normalized relative coordinates [0.0 - 1.0] to pixel coordinates (X, Y)
        based on this camera's current native frame dimensions.
        """
        x_px = int(round(x_norm * self.width))
        y_px = int(round(y_norm * self.height))
        # Clamp to frame boundary
        x_px = max(0, min(x_px, self.width - 1))
        y_px = max(0, min(y_px, self.height - 1))
        return x_px, y_px

    def denormalize_polygon(self, roi_polygon: List[List[float]]) -> np.ndarray:
        """
        Converts an array of normalized ROI vertices [[x1, y1], [x2, y2], ...]
        into an OpenCV-compatible int32 polygon array (N, 1, 2).
        """
        if not roi_polygon:
            return np.empty((0, 1, 2), dtype=np.int32)

        pts = [self.denormalize_point(p[0], p[1]) for p in roi_polygon]
        return np.array(pts, dtype=np.int32).reshape((-1, 1, 2))

    # ==========================================================================
    # WORKER INGESTION LOOP & LOGIC
    # ==========================================================================

    def _worker_loop(self) -> None:
        """
        Main execution loop. Attempts live HLS ingestion. If unavailable after
        max_hls_retries, seamlessly engages fallback video playback with looping.
        """
        hls_failed_attempts = 0
        backoff = self.initial_backoff

        while not self._stop_event.is_set():
            # 1. Attempt Live HLS Stream if configured and within retry threshold
            if self.stream_url and hls_failed_attempts < self.max_hls_retries:
                self._set_status(CameraStatus.RECONNECTING if hls_failed_attempts > 0 else CameraStatus.OFFLINE)
                logger.info(
                    f"[{self.camera_code}] Connecting to HLS stream: {self.stream_url} "
                    f"(attempt {hls_failed_attempts + 1}/{self.max_hls_retries})"
                )

                cap = self._open_capture(self.stream_url)
                if cap is not None and cap.isOpened():
                    ret, first_frame = cap.read()
                    if ret and first_frame is not None:
                        logger.info(f"[{self.camera_code}] Successfully connected to HLS stream.")
                        self._set_status(CameraStatus.CONNECTED)
                        self.current_source = f"hls:{self.stream_url}"
                        self._update_dimensions(first_frame)
                        self._store_frame(first_frame)

                        # Reset backoff upon successful connection
                        backoff = self.initial_backoff
                        hls_failed_attempts = 0

                        # Enter continuous 1 FPS HLS capture loop
                        stream_ended_cleanly = self._run_hls_capture_loop(cap)
                        cap.release()

                        if self._stop_event.is_set():
                            break

                        if not stream_ended_cleanly:
                            hls_failed_attempts += 1
                            logger.warning(
                                f"[{self.camera_code}] HLS stream disconnected. "
                                f"Failed attempts: {hls_failed_attempts}/{self.max_hls_retries}"
                            )
                    else:
                        cap.release()
                        hls_failed_attempts += 1
                        logger.warning(f"[{self.camera_code}] Could not read initial frame from HLS stream.")
                else:
                    if cap is not None:
                        cap.release()
                    hls_failed_attempts += 1
                    logger.warning(f"[{self.camera_code}] Failed to open HLS stream.")

                # If HLS still under threshold, wait using exponential backoff before retrying
                if hls_failed_attempts < self.max_hls_retries and not self._stop_event.is_set():
                    self._set_status(CameraStatus.RECONNECTING)
                    logger.info(f"[{self.camera_code}] Reconnecting in {backoff:.1f} seconds (exponential backoff)...")
                    if self._interruptible_sleep(backoff):
                        break
                    backoff = min(backoff * 2.0, self.max_backoff)
                continue

            # 2. Engage Fallback Video (.mp4)
            fallback_resolved = self._resolve_fallback_path()
            if fallback_resolved and fallback_resolved.exists():
                logger.info(
                    f"[{self.camera_code}] Engaging fallback video mode: {fallback_resolved.name} "
                    f"(HLS retries exhausted: {hls_failed_attempts})"
                )
                self._set_status(CameraStatus.FALLBACK_MODE)
                self.current_source = f"fallback:{fallback_resolved.name}"

                cap = self._open_capture(str(fallback_resolved))
                if cap is not None and cap.isOpened():
                    self._run_fallback_loop(cap, str(fallback_resolved))
                    cap.release()

                if self._stop_event.is_set():
                    break

                # After a full cycle or fallback exit, reset HLS retry counter to probe live stream again
                hls_failed_attempts = 0
                backoff = self.initial_backoff
            else:
                # 3. Neither HLS nor Fallback video is available
                self._set_status(CameraStatus.OFFLINE)
                self.current_source = None
                placeholder = self._generate_placeholder_frame("Camera Offline - Source Unavailable")
                self._store_frame(placeholder)
                logger.warning(
                    f"[{self.camera_code}] No valid stream URL or fallback video found at {self.fallback_path}. "
                    f"Sleeping for {backoff:.1f}s before re-evaluating."
                )
                if self._interruptible_sleep(backoff):
                    break
                backoff = min(backoff * 2.0, self.max_backoff)
                # Allow probing HLS again
                hls_failed_attempts = 0

    def _run_hls_capture_loop(self, cap: cv2.VideoCapture) -> bool:
        """
        Extracts the latest live frame at 1 FPS from the live HLS stream.
        Uses a dedicated drain reader thread so OpenCV never accumulates buffered
        frames, ensuring the on-screen CCTV clock seconds advance in real-time
        without freezing or experiencing 25-second buffer lag.
        Returns True if stopped cleanly, False if stream died unexpectedly.
        """
        latest_raw: Dict[str, Any] = {"frame": None, "read_ok": True}
        reader_stop = threading.Event()

        def _hls_drain_reader():
            while not reader_stop.is_set() and not self._stop_event.is_set():
                ret, frame = cap.read()
                if not ret or frame is None:
                    latest_raw["read_ok"] = False
                    break
                latest_raw["frame"] = frame
                # Yield brief time slice to avoid CPU starvation
                time.sleep(0.015)

        reader_t = threading.Thread(target=_hls_drain_reader, name=f"Drain-{self.camera_code}", daemon=True)
        reader_t.start()

        # Wait briefly for first live frame
        for _ in range(40):
            if latest_raw["frame"] is not None or not latest_raw["read_ok"]:
                break
            time.sleep(0.05)

        try:
            while not self._stop_event.is_set():
                cycle_start = time.time()

                if not latest_raw["read_ok"] or latest_raw["frame"] is None:
                    logger.warning(f"[{self.camera_code}] HLS read returned empty frame. Stream dropped.")
                    return False

                frame = latest_raw["frame"].copy()

                self._update_dimensions(frame)
                self._store_frame(frame)

                # Strict 1 FPS throttling: compute elapsed time and sleep for remaining fraction of 1.0s
                elapsed = time.time() - cycle_start
                sleep_duration = max(0.0, self.target_interval - elapsed)

                if self._interruptible_sleep(sleep_duration):
                    return True

            return True
        finally:
            reader_stop.set()
            reader_t.join(timeout=1.0)

    def _run_fallback_loop(self, cap: cv2.VideoCapture, video_path: str) -> None:
        """
        Loops through the local .mp4 video file at strict 1 FPS.
        Automatically rewinds to frame 0 when EOF is encountered.
        """
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        logger.info(f"[{self.camera_code}] Fallback video loaded with {total_frames} frames.")

        while not self._stop_event.is_set():
            cycle_start = time.time()

            ret, frame = cap.read()
            if not ret or frame is None:
                # Video reached EOF: loop back to the beginning
                logger.debug(f"[{self.camera_code}] Fallback video reached end. Looping to start.")
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                ret, frame = cap.read()
                if not ret or frame is None:
                    # Video file may be unreadable; reopen capture
                    cap.release()
                    cap = self._open_capture(video_path)
                    if cap is None or not cap.isOpened():
                        logger.error(f"[{self.camera_code}] Failed to reopen fallback video: {video_path}")
                        break
                    continue

            self._update_dimensions(frame)
            self._store_frame(frame)

            elapsed = time.time() - cycle_start
            sleep_duration = max(0.0, self.target_interval - elapsed)

            if self._interruptible_sleep(sleep_duration):
                break

    # ==========================================================================
    # INTERNAL HELPERS
    # ==========================================================================

    def _open_capture(self, source: str) -> Optional[cv2.VideoCapture]:
        """Safely creates a cv2.VideoCapture instance with minimal buffer lag."""
        try:
            cap = cv2.VideoCapture(source)
            if cap.isOpened():
                # Set buffer size to 1 to minimize latency on live streams
                cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            return cap
        except Exception as e:
            logger.error(f"[{self.camera_code}] Exception opening VideoCapture for {source}: {e}")
            return None

    def _resolve_fallback_path(self) -> Optional[Path]:
        """Resolves the fallback video file path relative to BASE_DIR if needed."""
        if not self.fallback_path:
            return None

        path = Path(self.fallback_path)
        if not path.is_absolute():
            path = BASE_DIR / path
        return path

    def _update_dimensions(self, frame: np.ndarray) -> None:
        """Dynamically caches frame width and height from actual frame array."""
        h, w = frame.shape[:2]
        if w != self.width or h != self.height:
            logger.info(
                f"[{self.camera_code}] Dynamic resolution updated: {self.width}x{self.height} -> {w}x{h}"
            )
            self.width = w
            self.height = h

    def _store_frame(self, frame: np.ndarray) -> None:
        """Processes frame through detection & loitering pipeline, then caches in memory."""
        now = datetime.now(timezone.utc)

        # Run AI detection and loitering evaluation
        annotated = frame
        detected_count = 0
        inside_count = 0
        violation_count = 0

        try:
            from app.services.detector_tracker import detector_service
            from app.services.loitering_engine import loitering_engine
            from app.services.capture_logger import capture_logger

            det_result = detector_service.detect_and_track(frame, camera_code=self.camera_code)
            detections = det_result.get("detections", [])
            detected_count = len(detections)

            eval_result = loitering_engine.process_frame(
                camera_code=self.camera_code,
                frame=frame,
                detections=detections,
                roi_polygon=self.roi_polygon,
                threshold_seconds=self.threshold_seconds,
            )

            annotated = eval_result.annotated_frame
            inside_count = len([s for s in eval_result.tracked_states if s.inside_roi])
            violation_count = len(eval_result.active_violations)

            # Auto-Capture & broadcast newly triggered violations
            for violation in eval_result.new_violations:
                record = capture_logger.log_and_broadcast_violation(
                    camera_code=self.camera_code,
                    camera_name=self.camera_name,
                    vehicle_state=violation,
                    annotated_frame=eval_result.annotated_frame,
                    model_used=det_result.get("model_used", "YOLOv8s"),
                    inference_ms=det_result.get("inference_ms", 0.0),
                    threshold_seconds=self.threshold_seconds,
                )
                if record and record.get("id"):
                    violation.event_id = record["id"]

            # Heartbeat duration updates for active loitering vehicles (every 5 seconds)
            for active_v in getattr(eval_result, "duration_updates", []):
                if active_v.event_id:
                    capture_logger.update_violation_duration(
                        event_id=active_v.event_id,
                        duration_seconds=active_v.duration_seconds,
                        is_final=False,
                        camera_code=self.camera_code,
                    )

            # Finalize total duration when vehicle departs the ROI
            for departed_v in getattr(eval_result, "departed_violations", []):
                if departed_v.event_id:
                    capture_logger.update_violation_duration(
                        event_id=departed_v.event_id,
                        duration_seconds=departed_v.duration_seconds,
                        is_final=True,
                        camera_code=self.camera_code,
                    )
        except Exception as e:
            logger.debug(f"[{self.camera_code}] CV pipeline evaluation notice: {e}")
            annotated = frame

        with self._frame_lock:
            self._latest_frame = frame
            self._latest_annotated_frame = annotated
            self.last_frame_timestamp = now
            self.frame_count += 1
            self.detected_vehicles_count = detected_count
            self.inside_roi_count = inside_count
            self.active_violations_count = violation_count

            # Update rolling FPS metric
            curr_time = time.time()
            self._fps_window.append(curr_time)
            self._fps_window = [t for t in self._fps_window if curr_time - t <= 5.0]
            if len(self._fps_window) > 1:
                duration = self._fps_window[-1] - self._fps_window[0]
                if duration > 0:
                    self.current_fps = (len(self._fps_window) - 1) / duration

    def _set_status(self, new_status: CameraStatus) -> None:
        """Updates camera status with logging on transition."""
        if self.status != new_status:
            logger.info(f"[{self.camera_code}] Camera status changed: {self.status.value} -> {new_status.value}")
            self.status = new_status

    def _interruptible_sleep(self, seconds: float) -> bool:
        """
        Sleeps for the given duration, but wakes up immediately if stop_event is set.
        Returns True if stop_event was triggered (worker should terminate), False if timed out normally.
        """
        if seconds <= 0:
            return self._stop_event.is_set()
        return self._stop_event.wait(timeout=seconds)

    def _generate_placeholder_frame(self, message: str) -> np.ndarray:
        """Generates an informative placeholder frame when no video source is available."""
        frame = np.zeros((self.height, self.width, 3), dtype=np.uint8)
        frame[:] = (32, 33, 36)  # Dark slate gray

        header = f"SILOTER CCTV - {self.camera_name.upper()} ({self.camera_code})"
        status_text = f"Status: {self.status.value}"
        sub_text = message
        dim_text = f"Resolution: {self.width}x{self.height} | Extraction: 1.0 FPS"

        # Scale font proportionally to frame height
        font_scale = max(0.6, self.height / 1000.0)
        thickness = max(1, int(round(font_scale * 2)))

        cv2.putText(
            frame, header, (int(self.width * 0.05), int(self.height * 0.35)),
            cv2.FONT_HERSHEY_SIMPLEX, font_scale * 1.1, (0, 220, 255), thickness, cv2.LINE_AA
        )
        cv2.putText(
            frame, status_text, (int(self.width * 0.05), int(self.height * 0.47)),
            cv2.FONT_HERSHEY_SIMPLEX, font_scale, (0, 165, 255), thickness, cv2.LINE_AA
        )
        cv2.putText(
            frame, sub_text, (int(self.width * 0.05), int(self.height * 0.58)),
            cv2.FONT_HERSHEY_SIMPLEX, font_scale * 0.9, (200, 200, 200), thickness, cv2.LINE_AA
        )
        cv2.putText(
            frame, dim_text, (int(self.width * 0.05), int(self.height * 0.69)),
            cv2.FONT_HERSHEY_SIMPLEX, font_scale * 0.8, (140, 140, 140), 1, cv2.LINE_AA
        )
        return frame


class StreamManager:
    """
    Central orchestrator managing all active CameraStreamWorkers across Bogor Trade Mall.
    Coordinates initialization, fault isolation, stream lifecycle, and metadata reporting.
    """

    def __init__(self):
        self._workers: Dict[str, CameraStreamWorker] = {}
        self._initialized = False

    def initialize_default_cameras(self) -> None:
        """Initializes workers for the 3 primary cameras defined in PRD and ARCHITECTURE."""
        if self._initialized:
            return

        camera_definitions = [
            {
                "code": CameraCode.EMPANG.value,
                "name": "Jl. Djuanda - Empang",
                "stream_url": settings.STREAM_URL_EMPANG,
                "fallback_path": settings.FALLBACK_VIDEO_EMPANG,
                "width": 1920,
                "height": 1080,
                "roi": [[0.15, 0.45], [0.75, 0.45], [0.85, 0.95], [0.05, 0.95]],
                "threshold": 60,
            },
            {
                "code": CameraCode.SURKEN.value,
                "name": "Jl. Djuanda - Suryakencana",
                "stream_url": settings.STREAM_URL_SURKEN,
                "fallback_path": settings.FALLBACK_VIDEO_SURKEN,
                "width": 1920,
                "height": 1080,
                "roi": [[0.20, 0.40], [0.80, 0.40], [0.90, 0.95], [0.10, 0.95]],
                "threshold": 60,
            },
            {
                "code": CameraCode.BALAIKOTA.value,
                "name": "Jl. Djuanda - Balaikota",
                "stream_url": settings.STREAM_URL_BALAIKOTA,
                "fallback_path": settings.FALLBACK_VIDEO_BALAIKOTA,
                "width": 704,
                "height": 576,
                "roi": [[0.25, 0.35], [0.75, 0.35], [0.85, 0.90], [0.15, 0.90]],
                "threshold": 60,
            },
        ]

        # Probe Supabase for runtime dynamic camera configs and fresh stream URLs
        try:
            from app.core.supabase_client import get_supabase_client
            supabase = get_supabase_client()
            if supabase:
                res = supabase.table("camera_configs").select("*").execute()
                if res.data:
                    db_map = {r["camera_code"].lower(): r for r in res.data}
                    for cam in camera_definitions:
                        code = cam["code"].lower()
                        if code in db_map:
                            db_cam = db_map[code]
                            if db_cam.get("stream_url"):
                                cam["stream_url"] = db_cam["stream_url"].strip()
                            if db_cam.get("camera_name"):
                                cam["name"] = db_cam["camera_name"].strip()
                            if db_cam.get("threshold_seconds"):
                                cam["threshold"] = db_cam["threshold_seconds"]
                            if db_cam.get("roi_polygon") and len(db_cam["roi_polygon"]) >= 3:
                                cam["roi"] = db_cam["roi_polygon"]
        except Exception as e:
            logger.warning(f"Could not query dynamic camera configs from Supabase at startup: {e}")

        for cam in camera_definitions:
            worker = CameraStreamWorker(
                camera_code=cam["code"],
                camera_name=cam["name"],
                stream_url=cam["stream_url"],
                fallback_path=cam["fallback_path"],
                default_width=cam["width"],
                default_height=cam["height"],
                target_fps=1.0,  # 1 FPS strict throttling (FR-02, NFR-04)
            )
            worker.update_config(
                roi_polygon=cam["roi"],
                threshold_seconds=cam["threshold"],
                is_configured=True,
            )
            self._workers[cam["code"]] = worker

        self._initialized = True
        logger.info(f"StreamManager initialized with {len(self._workers)} camera workers.")

    def start_all(self) -> None:
        """Starts all initialized camera workers."""
        if not self._initialized:
            self.initialize_default_cameras()

        for code, worker in self._workers.items():
            worker.start()

    def stop_all(self, timeout: float = 5.0) -> None:
        """Stops all active camera workers cleanly."""
        for code, worker in self._workers.items():
            worker.stop(timeout=timeout)

    def get_worker(self, camera_code: str) -> Optional[CameraStreamWorker]:
        """Retrieves a specific camera stream worker by camera code."""
        if not self._initialized:
            self.initialize_default_cameras()
        return self._workers.get(camera_code.lower())

    def get_latest_frame(
        self, camera_code: str
    ) -> Tuple[Optional[np.ndarray], Optional[datetime], CameraStatus]:
        """Retrieves the latest raw frame for the given camera code."""
        worker = self.get_worker(camera_code)
        if worker:
            return worker.get_latest_frame()
        return None, None, CameraStatus.OFFLINE

    def get_latest_annotated_frame(
        self, camera_code: str
    ) -> Tuple[Optional[np.ndarray], Optional[datetime], CameraStatus]:
        """Retrieves the latest frame with ROI & bounding box overlays for MJPEG streaming."""
        worker = self.get_worker(camera_code)
        if worker:
            return worker.get_latest_annotated_frame()
        return None, None, CameraStatus.OFFLINE

    def update_camera_config(
        self,
        camera_code: str,
        roi_polygon: Optional[List[List[float]]] = None,
        threshold_seconds: Optional[int] = None,
        stream_url: Optional[str] = None,
        is_configured: Optional[bool] = None,
    ) -> bool:
        """Dynamically updates active worker configuration on-the-fly."""
        worker = self.get_worker(camera_code)
        if worker:
            worker.update_config(
                roi_polygon=roi_polygon,
                threshold_seconds=threshold_seconds,
                stream_url=stream_url,
                is_configured=is_configured,
            )
            return True
        return False

    def get_camera_status(self, camera_code: str) -> Optional[dict]:
        """Returns the operational status dict of a specific camera worker."""
        worker = self.get_worker(camera_code)
        if worker:
            return worker.get_info()
        return None

    def get_all_statuses(self) -> Dict[str, dict]:
        """Returns a dictionary containing operational statuses of all registered cameras."""
        if not self._initialized:
            self.initialize_default_cameras()
        return {code: worker.get_info() for code, worker in self._workers.items()}


# Global singleton instance for application-wide use
stream_manager = StreamManager()

