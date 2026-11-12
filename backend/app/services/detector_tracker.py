from datetime import datetime, timezone
import logging
from pathlib import Path
import threading
import time
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from ultralytics import YOLO

from app.core.config import settings, BASE_DIR

logger = logging.getLogger("siloter.detector_tracker")


class VehicleDetectorTracker:
    """
    Dedicated Single-Model Computer Vision detection and tracking service.
    Exclusively runs YOLOv8s in ONNX format ('yolov8s_siloter.onnx') paired
    with ByteTrack for low-framerate (1 FPS) traffic monitoring.
    Operates directly on the ONNX runtime with zero fallback to .pt weights.
    """

    MODEL_FILENAME = "yolov8s_siloter.onnx"
    MODEL_DISPLAY_NAME = "YOLOv8s"
    MODEL_KEY = "yolov8s"

    def __init__(self, weight_file: Optional[str] = None):
        self._lock = threading.RLock()
        self.models_dir = BASE_DIR / "models"
        self.tracker_config = str(self.models_dir / "bytetrack.yaml")

        chosen_filename = weight_file or self.MODEL_FILENAME
        self.active_weight_path = self.models_dir / chosen_filename

        # Active model metadata
        self.active_model_key: str = self.MODEL_KEY
        self.active_display_name: str = self.MODEL_DISPLAY_NAME

        # Verify that the ONNX model file exists (No silent fallback to .pt)
        if not self.active_weight_path.exists():
            error_msg = (
                f"Required ONNX model '{chosen_filename}' not found at '{self.active_weight_path}'. "
                "Ensure 'yolov8s_siloter.onnx' is placed in backend/models/."
            )
            logger.critical(error_msg)
            raise FileNotFoundError(error_msg)

        logger.info(f"YOLOv8s ONNX detector initialized with weight: {self.active_weight_path.name}")

        # Per-camera model instances to guarantee isolated ByteTrack states across camera streams (NFR-02)
        # camera_code -> YOLO instance
        self._camera_models: Dict[str, YOLO] = {}

    def switch_model(self, model_name: str) -> Tuple[bool, str]:
        """
        Maintains API compatibility. Informs caller that SILOTER is strictly locked
        to YOLOv8s ONNX in production as decided by the AI engineering specification.
        """
        normalized_key = model_name.strip().lower()
        if normalized_key in ["yolov8s", "yolov8", "yolov8s_siloter.onnx"]:
            return True, f"Model '{self.MODEL_DISPLAY_NAME}' (ONNX) is already the active production model."
        
        logger.warning(
            f"Model switch request for '{model_name}' rejected. "
            f"SILOTER is locked exclusively to {self.MODEL_DISPLAY_NAME} ONNX."
        )
        return False, (
            f"Arsitektur '{model_name}' tidak aktif. SILOTER dikunci khusus pada model "
            f"{self.MODEL_DISPLAY_NAME} ONNX ('{self.MODEL_FILENAME}')."
        )

    def _get_or_create_model_for_camera(self, camera_code: str) -> YOLO:
        """
        Retrieves or instantiates an isolated YOLO model for a given camera stream.
        Guarantees that ByteTrack state for one camera never bleeds into another (NFR-02).
        """
        with self._lock:
            code = camera_code.strip().lower()
            if code not in self._camera_models:
                logger.info(
                    f"Instantiating isolated YOLOv8s ONNX tracker for camera '{code}' "
                    f"using model file '{self.active_weight_path.name}'"
                )
                model = YOLO(str(self.active_weight_path), task="detect")
                self._camera_models[code] = model
            return self._camera_models[code]

    def detect_and_track(
        self,
        frame: np.ndarray,
        camera_code: str = "default",
    ) -> Dict[str, Any]:
        """
        Executes object detection and ByteTrack multi-object tracking on a single frame.
        Uses 1 FPS-optimized bytetrack.yaml tracker parameters.

        Returns:
            Dict containing:
                - 'detections': List of tracked vehicle dictionaries
                - 'inference_ms': Float inference duration in milliseconds
                - 'model_used': String active model display name ('YOLOv8s')
                - 'model_weight': String weight filename ('yolov8s_siloter.onnx')
                - 'camera_code': String camera identifier
                - 'timestamp': UTC ISO timestamp
        """
        if frame is None or frame.size == 0:
            return {
                "detections": [],
                "inference_ms": 0.0,
                "model_used": self.active_display_name,
                "model_weight": self.active_weight_path.name,
                "camera_code": camera_code,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

        # Retrieve isolated camera model instance
        model = self._get_or_create_model_for_camera(camera_code)

        # High-resolution inference timer for academic benchmarking
        start_time = time.perf_counter()

        try:
            # Run Ultralytics tracking with ByteTrack directly on ONNX
            results = model.track(
                source=frame,
                persist=True,
                tracker=self.tracker_config,
                verbose=False,
            )
        except Exception as e:
            logger.error(f"[{camera_code}] Detection/tracking error on ONNX: {e}")
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            return {
                "detections": [],
                "inference_ms": round(elapsed_ms, 2),
                "model_used": self.active_display_name,
                "model_weight": self.active_weight_path.name,
                "camera_code": camera_code,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "error": str(e),
            }

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        detections: List[Dict[str, Any]] = []

        if results and len(results) > 0:
            r = results[0]
            boxes = r.boxes

            if boxes is not None and len(boxes) > 0:
                for box in boxes:
                    # Bounding box coordinates [x1, y1, x2, y2]
                    xyxy = box.xyxy[0].cpu().numpy().tolist()
                    conf = float(box.conf[0].cpu().numpy())
                    cls_id = int(box.cls[0].cpu().numpy())
                    cls_name = model.names.get(cls_id, f"class_{cls_id}")

                    # Formatted Track ID (e.g., 'Angkot_01', 'Angkot_12')
                    raw_track_id = int(box.id[0].cpu().numpy()) if box.id is not None else None
                    if raw_track_id is not None:
                        formatted_track_id = f"Angkot_{raw_track_id:02d}"
                    else:
                        formatted_track_id = "Angkot_Untracked"

                    detections.append(
                        {
                            "track_id": formatted_track_id,
                            "raw_track_id": raw_track_id,
                            "bbox": [round(coord, 2) for coord in xyxy],
                            "confidence": round(conf, 4),
                            "class_id": cls_id,
                            "class_name": cls_name,
                        }
                    )

        return {
            "detections": detections,
            "inference_ms": round(elapsed_ms, 2),
            "model_used": self.active_display_name,
            "model_weight": self.active_weight_path.name,
            "camera_code": camera_code,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    def get_status(self) -> Dict[str, Any]:
        """Returns the current detector service configuration and active ONNX model."""
        with self._lock:
            return {
                "active_model": self.active_display_name,
                "active_key": self.active_model_key,
                "weight_filename": self.active_weight_path.name,
                "format": "ONNX",
                "is_fallback": False,
                "tracker_config": Path(self.tracker_config).name,
                "active_camera_pipelines": list(self._camera_models.keys()),
            }


# Backwards compatibility alias
DualModelDetector = VehicleDetectorTracker

# Application-wide global detector instance locked directly to yolov8s_siloter.onnx
detector_service = VehicleDetectorTracker(
    weight_file="yolov8s_siloter.onnx"
)
