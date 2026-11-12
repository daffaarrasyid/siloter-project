from datetime import datetime, timezone
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import uuid
import cv2
import numpy as np

from app.core.config import settings, BASE_DIR
from app.core.supabase_client import get_supabase_client
from app.api.websocket import connection_manager
from app.schemas.payload_schemas import ValidationStatus

logger = logging.getLogger("siloter.capture_logger")


def determine_session_type(dt: Optional[datetime] = None) -> str:
    """
    Classifies traffic monitoring time into operational analytical sessions:
    - Akhir Pekan: Saturday & Sunday
    - Rush Hour Pagi: Monday - Friday, 06:00 - 09:59
    - Off-Peak Siang: Monday - Friday, 10:00 - 15:59
    - Rush Hour Sore: Monday - Friday, 16:00 - 20:59
    - Off-Peak Malam: Monday - Friday, 21:00 - 05:59
    """
    now = dt or datetime.now(timezone.utc)
    # Check weekday: 5 = Saturday, 6 = Sunday
    if now.weekday() in (5, 6):
        return "Akhir Pekan"

    hour = now.hour
    if 6 <= hour < 10:
        return "Rush Hour Pagi"
    elif 10 <= hour < 16:
        return "Off-Peak Siang"
    elif 16 <= hour < 21:
        return "Rush Hour Sore"
    else:
        return "Off-Peak Malam"


class CaptureLoggerService:
    """
    Evidence Capture, Cloud Storage Upload, Database Logging, and Alert Broadcasting Service.
    Enforces Single-Capture locking per loitering cycle to avoid database/storage spam (NFR-03).
    """

    def __init__(self):
        self.captures_dir = BASE_DIR / "static" / "captures"
        self.captures_dir.mkdir(parents=True, exist_ok=True)
        # In-memory event log cache for offline development/testing
        self._local_event_logs: List[Dict[str, Any]] = []
        # Cache camera UUIDs: camera_code -> UUID string
        self._camera_uuid_cache: Dict[str, str] = {}

    def get_or_create_camera_uuid(self, camera_code: str) -> str:
        """Retrieves camera UUID from Supabase or provides deterministic UUID for offline mode."""
        code = camera_code.strip().lower()
        if code in self._camera_uuid_cache:
            return self._camera_uuid_cache[code]

        supabase = get_supabase_client()
        if supabase:
            try:
                res = supabase.table("camera_configs").select("id").eq("camera_code", code).execute()
                if res.data and len(res.data) > 0:
                    cam_id = res.data[0]["id"]
                    self._camera_uuid_cache[code] = cam_id
                    return cam_id
            except Exception as e:
                logger.warning(f"Could not query camera_id from Supabase: {e}")

        # Deterministic UUID fallback for offline testing
        fallback_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"siloter.camera.{code}"))
        self._camera_uuid_cache[code] = fallback_uuid
        return fallback_uuid

    @staticmethod
    def enhance_crop(crop: np.ndarray) -> np.ndarray:
        """
        Enhances cropped vehicle image using CLAHE on luminance channel,
        bilateral filter for compression noise removal, and subtle unsharp masking for edge crispness.
        """
        if crop.size == 0 or crop.shape[0] < 5 or crop.shape[1] < 5:
            return crop

        try:
            # 1. Bilateral Filter: Smooth HLS compression artifacts while keeping edges sharp
            denoised = cv2.bilateralFilter(crop, d=7, sigmaColor=50, sigmaSpace=50)

            # 2. CLAHE (Contrast Limited Adaptive Histogram Equalization) in LAB color space
            lab = cv2.cvtColor(denoised, cv2.COLOR_BGR2LAB)
            l_channel, a_channel, b_channel = cv2.split(lab)
            clahe = cv2.createCLAHE(clipLimit=2.2, tileGridSize=(8, 8))
            enhanced_l = clahe.apply(l_channel)
            merged_lab = cv2.merge((enhanced_l, a_channel, b_channel))
            enhanced_bgr = cv2.cvtColor(merged_lab, cv2.COLOR_LAB2BGR)

            # 3. Subtle Unsharp Masking for crisp stickers, lettering, and plate contours
            gaussian = cv2.GaussianBlur(enhanced_bgr, (0, 0), 2.0)
            sharpened = cv2.addWeighted(enhanced_bgr, 1.25, gaussian, -0.25, 0)
            return sharpened
        except Exception:
            return crop

    def apply_picture_in_picture_zoom(
        self,
        frame: np.ndarray,
        bbox: List[float],
        track_id: str = "",
    ) -> np.ndarray:
        """
        Overlays an enhanced zoomed-in Picture-in-Picture (PIP) inset of the target vehicle
        in the top-right corner of the full frame to maintain legal spatial context and high-res vehicle detail.
        """
        if not bbox or len(bbox) < 4:
            return frame

        canvas = frame.copy()
        h, w = canvas.shape[:2]

        x1, y1, x2, y2 = bbox
        bw = max(10.0, x2 - x1)
        bh = max(10.0, y2 - y1)

        # Pad 20% on all sides for vehicle visual breathing room
        pad_x = int(bw * 0.20)
        pad_y = int(bh * 0.20)
        crop_x1 = max(0, int(x1 - pad_x))
        crop_y1 = max(0, int(y1 - pad_y))
        crop_x2 = min(w, int(x2 + pad_x))
        crop_y2 = min(h, int(y2 + pad_y))

        crop = canvas[crop_y1:crop_y2, crop_x1:crop_x2]
        if crop.size == 0 or crop.shape[0] < 10 or crop.shape[1] < 10:
            return canvas

        # Enhance vehicle crop with CLAHE + Bilateral + Sharpen
        enhanced_crop = self.enhance_crop(crop)

        # Calculate inset box dimensions (~24% of frame width, keeping aspect ratio)
        target_w = max(240, min(int(w * 0.24), 420))
        crop_aspect = enhanced_crop.shape[0] / max(1, enhanced_crop.shape[1])
        target_h = int(target_w * crop_aspect)

        # Clamp max height to 34% of frame height
        max_h = int(h * 0.34)
        if target_h > max_h:
            target_h = max_h
            target_w = int(target_h / max(0.01, crop_aspect))

        # Upscale using Lanczos-4 for crisp, clean perbesaran detail
        resized_crop = cv2.resize(
            enhanced_crop, (target_w, target_h), interpolation=cv2.INTER_LANCZOS4
        )

        margin = 14
        header_h = 24
        ix1 = w - target_w - margin
        iy1 = margin
        ix2 = ix1 + target_w
        iy2 = iy1 + target_h + header_h

        # Boundary check
        if ix1 < 0 or iy1 < 0 or ix2 > w or iy2 > h:
            return canvas

        # Draw dark translucent drop shadow behind inset container
        shadow_margin = 4
        sx1 = max(0, ix1 - shadow_margin)
        sy1 = max(0, iy1 - shadow_margin)
        sx2 = min(w, ix2 + shadow_margin)
        sy2 = min(h, iy2 + shadow_margin)

        overlay = canvas.copy()
        cv2.rectangle(overlay, (sx1, sy1), (sx2, sy2), (15, 23, 42), -1)
        cv2.addWeighted(overlay, 0.45, canvas, 0.55, 0, canvas)

        # Header banner (Red badge for violation focus)
        cv2.rectangle(canvas, (ix1, iy1), (ix2, iy1 + header_h), (30, 30, 220), -1)

        # Header text
        header_text = f"DETAIL TARGET ({track_id or 'ANGKOT'}) - ENHANCED"
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.38
        thickness = 1
        cv2.putText(
            canvas,
            header_text,
            (ix1 + 8, iy1 + 16),
            font,
            font_scale,
            (255, 255, 255),
            thickness,
            cv2.LINE_AA,
        )

        # Place enhanced crop into canvas
        canvas[iy1 + header_h : iy2, ix1 : ix2] = resized_crop

        # Draw solid red border around inset container
        cv2.rectangle(canvas, (ix1, iy1), (ix2, iy2), (0, 0, 255), 2, cv2.LINE_AA)

        return canvas

    def apply_evidence_watermark(
        self,
        frame: np.ndarray,
        camera_name: str,
        camera_code: str,
        timestamp: datetime,
    ) -> np.ndarray:
        """
        Adds high-visibility legal evidence timestamp and CCTV location watermark banner
        onto the top-left or bottom-left corner of the captured frame.
        """
        annotated = frame.copy()
        h, w = annotated.shape[:2]

        time_str = timestamp.strftime("%Y-%m-%d %H:%M:%S UTC")
        watermark_line1 = f"SILOTER AUTO-CAPTURE EVIDENCE | {camera_name.upper()} ({camera_code})"
        watermark_line2 = f"WAKTU: {time_str} | KOTA BOGOR"

        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = max(0.55, min(w, h) / 1400.0)
        thickness = max(1, int(round(font_scale * 2)))

        (w1, h1), _ = cv2.getTextSize(watermark_line1, font, font_scale, thickness)
        (w2, h2), _ = cv2.getTextSize(watermark_line2, font, font_scale, thickness)
        banner_w = max(w1, w2) + 24
        banner_h = h1 + h2 + 28

        # Draw semi-transparent dark banner at bottom-left
        x1, y1 = 12, h - banner_h - 12
        x2, y2 = x1 + banner_w, h - 12

        overlay = annotated.copy()
        cv2.rectangle(overlay, (x1, y1), (x2, y2), (20, 20, 20), -1)
        cv2.addWeighted(overlay, 0.75, annotated, 0.25, 0, annotated)

        # Draw borders and text
        cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 0, 255), 2, cv2.LINE_AA)
        cv2.putText(
            annotated,
            watermark_line1,
            (x1 + 10, y1 + h1 + 8),
            font,
            font_scale,
            (0, 255, 255),
            thickness,
            cv2.LINE_AA,
        )
        cv2.putText(
            annotated,
            watermark_line2,
            (x1 + 10, y1 + h1 + h2 + 18),
            font,
            font_scale,
            (255, 255, 255),
            thickness - 1 if thickness > 1 else 1,
            cv2.LINE_AA,
        )
        return annotated

    def save_and_upload_evidence(
        self,
        frame: np.ndarray,
        camera_code: str,
        track_id: str,
        timestamp: datetime,
    ) -> Tuple[str, str]:
        """
        Encodes frame to JPEG (quality 85), uploads to Supabase Storage bucket 'violation-evidence',
        or falls back to local static directory storage.
        Returns:
            Tuple of (storage_path, evidence_url).
        """
        # Compress JPEG (Quality 85 < 500 KB)
        encode_params = [int(cv2.IMWRITE_JPEG_QUALITY), 85]
        success, encoded_img = cv2.imencode(".jpg", frame, encode_params)
        if not success:
            raise RuntimeError("Failed to encode frame to JPEG format.")

        img_bytes = encoded_img.tobytes()
        timestamp_slug = timestamp.strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp_slug}_{camera_code}_{track_id}.jpg"
        storage_path = f"evidence/{camera_code}/{filename}"

        # 1. Attempt upload to Supabase Storage
        supabase = get_supabase_client()
        if supabase:
            try:
                bucket_name = settings.SUPABASE_STORAGE_BUCKET
                logger.info(f"Uploading evidence ({len(img_bytes)} bytes) to bucket '{bucket_name}'...")
                # Upload with upsert option
                supabase.storage.from_(bucket_name).upload(
                    path=storage_path,
                    file=img_bytes,
                    file_options={"content-type": "image/jpeg", "upsert": "true"},
                )
                evidence_url = supabase.storage.from_(bucket_name).get_public_url(storage_path)
                logger.info(f"Evidence successfully uploaded to Supabase Storage: {evidence_url}")
                return storage_path, evidence_url
            except Exception as e:
                logger.warning(f"Supabase Storage upload failed ({e}). Falling back to local disk storage.")

        # 2. Fallback to Local Disk Storage
        local_camera_dir = self.captures_dir / camera_code
        local_camera_dir.mkdir(parents=True, exist_ok=True)
        local_filepath = local_camera_dir / filename
        with open(local_filepath, "wb") as f:
            f.write(img_bytes)

        local_url = f"/static/captures/{camera_code}/{filename}"
        logger.info(f"Evidence saved locally: {local_filepath} -> {local_url}")
        return str(local_filepath), local_url

    def log_and_broadcast_violation(
        self,
        camera_code: str,
        camera_name: str,
        vehicle_state: Any,  # TrackLoiteringState
        annotated_frame: np.ndarray,
        model_used: str,
        inference_ms: float = 0.0,
        threshold_seconds: int = 60,
    ) -> Dict[str, Any]:
        """
        Core pipeline when loitering violation occurs:
        1. Verifies/enforces Single-Capture Lock (is_captured = True).
        2. Applies evidence timestamp watermark.
        3. Encodes and uploads evidence image.
        4. Classifies traffic session category.
        5. Logs record into Supabase PostgreSQL (violation_events).
        6. Broadcasts real-time WebSocket alert to Next.js clients.
        """
        now = datetime.now(timezone.utc)
        event_id = str(uuid.uuid4())
        camera_uuid = self.get_or_create_camera_uuid(camera_code)
        session_type = determine_session_type(now)

        # 1. Enforce Single-Capture Lock (Rule 11 AGENTS.md) and bind event_id for dynamic duration sync
        vehicle_state.is_captured = True
        vehicle_state.event_id = event_id

        # 2. Picture-in-Picture Zoom & Enhancement on target vehicle
        pip_frame = self.apply_picture_in_picture_zoom(
            frame=annotated_frame,
            bbox=getattr(vehicle_state, "last_bbox", []),
            track_id=getattr(vehicle_state, "track_id", ""),
        )

        # 3. Watermark
        watermarked_frame = self.apply_evidence_watermark(
            frame=pip_frame,
            camera_name=camera_name,
            camera_code=camera_code,
            timestamp=now,
        )

        # 3. Save & Upload Evidence Image
        storage_path, evidence_url = self.save_and_upload_evidence(
            frame=watermarked_frame,
            camera_code=camera_code,
            track_id=vehicle_state.track_id,
            timestamp=now,
        )

        # 4. Record Payload
        event_record = {
            "id": event_id,
            "camera_id": camera_uuid,
            "camera_code": camera_code,
            "camera_name": camera_name,
            "vehicle_track_id": vehicle_state.track_id,
            "detected_at": now.isoformat(),
            "duration_seconds": vehicle_state.duration_seconds,
            "threshold_seconds": threshold_seconds,
            "model_used": model_used,
            "inference_ms": round(inference_ms, 2),
            "evidence_path": storage_path,
            "evidence_url": evidence_url,
            "session_type": session_type,
            "validation_status": ValidationStatus.PENDING.value,
        }

        # 5. Save to Supabase PostgreSQL
        supabase = get_supabase_client()
        if supabase:
            try:
                db_payload = {
                    "id": event_id,
                    "camera_id": camera_uuid,
                    "vehicle_track_id": vehicle_state.track_id,
                    "detected_at": now.isoformat(),
                    "duration_seconds": vehicle_state.duration_seconds,
                    "model_used": model_used,
                    "inference_ms": round(inference_ms, 2),
                    "evidence_path": storage_path,
                    "session_type": session_type,
                    "validation_status": ValidationStatus.PENDING.value,
                }
                supabase.table("violation_events").insert(db_payload).execute()
                logger.info(f"Violation event {event_id} logged to Supabase PostgreSQL.")
            except Exception as e:
                logger.error(f"Failed to insert violation_event into Supabase: {e}")
                self._local_event_logs.append(event_record)
        else:
            self._local_event_logs.append(event_record)
            logger.info(f"Offline mode: event {event_id} cached in local memory.")

        # 6. Real-time WebSocket Alert Broadcast (< 5 seconds latency NFR-03)
        websocket_payload = {
            "event_type": "loitering_alert",
            "event_id": event_id,
            "camera_code": camera_code,
            "camera_name": camera_name,
            "vehicle_track_id": vehicle_state.track_id,
            "detected_at": now.isoformat(),
            "duration_seconds": vehicle_state.duration_seconds,
            "threshold_seconds": threshold_seconds,
            "model_used": model_used,
            "inference_ms": round(inference_ms, 2),
            "session_type": session_type,
            "evidence_url": evidence_url,
            "validation_status": ValidationStatus.PENDING.value,
        }

        connection_manager.broadcast_sync(websocket_payload)
        logger.info(
            f"Alert broadcast dispatched for {vehicle_state.track_id} on camera '{camera_code}'."
        )

        return event_record

    def update_violation_duration(
        self,
        event_id: str,
        duration_seconds: int,
        is_final: bool = False,
        camera_code: str = "",
    ) -> None:
        """
        Dynamically updates loitering duration in database and broadcasts
        real-time WebSocket duration update without spamming storage uploads (AGENTS.md Rule 11).
        """
        # 1. Update in-memory local cache
        for ev in self._local_event_logs:
            if ev.get("id") == event_id:
                ev["duration_seconds"] = duration_seconds
                break

        # 2. Update Supabase PostgreSQL
        supabase = get_supabase_client()
        if supabase:
            try:
                supabase.table("violation_events").update(
                    {"duration_seconds": duration_seconds}
                ).eq("id", event_id).execute()
                logger.debug(
                    f"Updated violation_event {event_id} duration: {duration_seconds}s (is_final={is_final})"
                )
            except Exception as e:
                logger.warning(f"Could not update violation duration in Supabase: {e}")

        # 3. Broadcast real-time WebSocket pulse (< 5s latency NFR-03)
        ws_payload = {
            "event_type": "duration_update",
            "event_id": event_id,
            "duration_seconds": duration_seconds,
            "is_final": is_final,
            "camera_code": camera_code,
        }
        connection_manager.broadcast_sync(ws_payload)

    def get_recent_events(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Retrieves recent violation events (from Supabase or local cache)."""
        supabase = get_supabase_client()
        if supabase:
            try:
                res = (
                    supabase.table("violation_events")
                    .select("*")
                    .order("detected_at", desc=True)
                    .limit(limit)
                    .execute()
                )
                if res.data:
                    return res.data
            except Exception as e:
                logger.warning(f"Could not fetch events from Supabase: {e}")
        return list(reversed(self._local_event_logs[-limit:]))


# Application-wide global capture logger service
capture_logger = CaptureLoggerService()
