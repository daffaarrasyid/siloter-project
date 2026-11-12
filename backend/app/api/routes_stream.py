import asyncio
import logging
from typing import Dict
import cv2
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse

from app.services.stream_manager import stream_manager
from app.schemas.payload_schemas import CameraCode

logger = logging.getLogger("siloter.routes_stream")

router = APIRouter(prefix="/api/stream", tags=["Streaming"])


async def mjpeg_frame_generator(camera_code: str):
    """
    Asynchronous generator yielding multipart JPEG frames at 1 FPS
    for browser <img> elements in Next.js Command Center.
    Uses frame timestamp caching to avoid redundant JPEG encodes and ensure
    buttery-smooth real-time delivery without event loop stutter.
    """
    code = camera_code.strip().lower()
    worker = stream_manager.get_worker(code)
    if not worker:
        logger.error(f"Streaming requested for unregistered camera: {camera_code}")
        return

    logger.info(f"MJPEG client connected for camera '{code}'.")

    last_ts = None
    cached_frame_bytes = b""

    try:
        while True:
            # Retrieve latest annotated frame (with ROI & detection bounding boxes)
            frame, timestamp, cam_status = worker.get_latest_annotated_frame()
            if frame is None:
                frame = worker._generate_placeholder_frame("Waiting for CCTV stream...")
                timestamp = None

            # Only re-encode when a new frame timestamp is detected or cache is empty
            if timestamp != last_ts or not cached_frame_bytes:
                success, buffer = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
                if success:
                    cached_frame_bytes = buffer.tobytes()
                    last_ts = timestamp

            if cached_frame_bytes:
                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n"
                    b"Content-Length: " + str(len(cached_frame_bytes)).encode() + b"\r\n\r\n"
                    + cached_frame_bytes + b"\r\n"
                )

            # Responsive polling interval: 0.5s checks allow clean 1 FPS transitions
            await asyncio.sleep(0.5)
    except asyncio.CancelledError:
        logger.info(f"MJPEG client disconnected from camera '{code}'.")
    except Exception as e:
        logger.debug(f"Stream generator connection closed for '{code}': {e}")


@router.get("/{camera_code}")
async def get_camera_stream(camera_code: str):
    """
    Streams annotated live MJPEG feed from the specified CCTV camera.
    Directly compatible with Next.js <img src="/api/stream/empang" />.
    """
    valid_codes = [c.value for c in CameraCode]
    normalized_code = camera_code.strip().lower()

    if normalized_code not in valid_codes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Camera code '{camera_code}' is invalid. Supported: {valid_codes}",
        )

    return StreamingResponse(
        mjpeg_frame_generator(normalized_code),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


@router.get("/status/all", response_model=Dict[str, dict])
def get_all_stream_statuses():
    """
    Returns real-time connection status, resolution, FPS, and detected vehicle counts
    inside and outside ROI for all 3 CCTV locations.
    """
    return stream_manager.get_all_statuses()

