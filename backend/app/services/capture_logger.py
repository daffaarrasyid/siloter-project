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

        # 1. Enforce Single-Capture Lock (Rule 11 AGENTS.md)
        vehicle_state.is_captured = True

        # 2. Watermark
        watermarked_frame = self.apply_evidence_watermark(
            frame=annotated_frame,
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
