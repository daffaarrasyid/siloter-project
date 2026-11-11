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
    """
    code = camera_code.strip().lower()
    worker = stream_manager.get_worker(code)
    if not worker:
        logger.error(f"Streaming requested for unregistered camera: {camera_code}")
        return

    logger.info(f"MJPEG client connected for camera '{code}'.")

    try:
        while True:
            # Retrieve latest annotated frame (with ROI & detection bounding boxes)
            frame, timestamp, cam_status = worker.get_latest_annotated_frame()
            if frame is None:
                frame = worker._generate_placeholder_frame("Waiting for CCTV stream...")

            # Encode to JPEG
            success, buffer = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
            if not success:
                await asyncio.sleep(0.5)
                continue

            frame_bytes = buffer.tobytes()

            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n"
                b"Content-Length: " + str(len(frame_bytes)).encode() + b"\r\n\r\n"
                + frame_bytes + b"\r\n"
            )

            # Sleep ~0.5s to 1.0s to align with 1 FPS sampling
            await asyncio.sleep(0.8)
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

