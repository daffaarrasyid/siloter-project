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


class DualModelDetector:
    """
    Unified Computer Vision detection and tracking service.
    Orchestrates YOLOv26n (primary end-to-end NMS-free) and YOLOv8s (baseline comparison)
    with ByteTrack optimized for low frame-rate (1 FPS) traffic monitoring.
    Features thread-safe on-the-fly model switching without server restarts.
    """

    MODEL_REGISTRY: Dict[str, Dict[str, str]] = {
        "yolov26n": {
            "display_name": "YOLOv26n",
            "filename": "yolov26n_siloter.onnx",
            "description": "Primary End-to-End NMS-Free Architecture",
        },
        "yolov8s": {
            "display_name": "YOLOv8s",
            "filename": "yolov8s_siloter.onnx",
            "description": "Baseline Comparison Architecture",
        },
        "yolov8": {
            "display_name": "YOLOv8s",
            "filename": "yolov8s_siloter.onnx",
            "description": "Baseline Comparison Architecture (Alias)",
        },
    }

    FALLBACK_MODEL_NAME = "yolov8n.pt"

    def __init__(self, initial_model: str = "yolov26n"):
        self._lock = threading.RLock()
        self.models_dir = BASE_DIR / "models"
        self.tracker_config = str(self.models_dir / "bytetrack.yaml")

        # Active model metadata
        self.active_model_key: str = "yolov26n"
        self.active_display_name: str = "YOLOv26n"
        self.active_weight_path: Path = self.models_dir / "yolov26n_siloter.onnx"
        self.is_using_fallback_weight: bool = False

        # Per-camera model instances to guarantee isolated ByteTrack states (NFR-02)
        # camera_code -> YOLO instance
        self._camera_models: Dict[str, YOLO] = {}

        # Initialize with requested model
        self.switch_model(initial_model)

    def switch_model(self, model_name: str) -> Tuple[bool, str]:
        """
        Switches the active model architecture on-the-fly with thread-lock safety.
        Loads the model weights and re-initializes per-camera tracker pipelines.
        """
        normalized_key = model_name.strip().lower()

        with self._lock:
            # Match registered models
            if normalized_key in self.MODEL_REGISTRY:
                reg = self.MODEL_REGISTRY[normalized_key]
                target_key = "yolov8s" if normalized_key == "yolov8" else normalized_key
                target_filename = reg["filename"]
                display_name = reg["display_name"]
            else:
                logger.warning(
                    f"Unknown model '{model_name}'. Defaulting to 'yolov26n'."
                )
                target_key = "yolov26n"
                target_filename = self.MODEL_REGISTRY["yolov26n"]["filename"]
                display_name = self.MODEL_REGISTRY["yolov26n"]["display_name"]

            target_path = self.models_dir / target_filename

            # Check if custom .onnx weight exists, otherwise use fallback .pt
            if target_path.exists():
                selected_path = target_path
                using_fallback = False
                logger.info(f"Loading custom ONNX model weights: {selected_path.name}")
            else:
                fallback_path = self.models_dir / self.FALLBACK_MODEL_NAME
                if fallback_path.exists():
                    selected_path = fallback_path
                else:
                    selected_path = Path(self.FALLBACK_MODEL_NAME)
                using_fallback = True
                logger.warning(
                    f"Custom weight file '{target_filename}' not found in '{self.models_dir}'. "
                    f"Falling back to standard '{self.FALLBACK_MODEL_NAME}' for testing/demonstration."
                )

            # Test-load the model to verify integrity before switching active references
            try:
                test_model = YOLO(str(selected_path), task="detect")
                # Pre-warm/verify names dict
                _ = test_model.names
            except Exception as e:
                err_msg = f"Failed to load weights '{selected_path}': {e}"
                logger.error(err_msg)
                return False, err_msg

            # Update active references atomically
            self.active_model_key = target_key
            self.active_display_name = display_name
            self.active_weight_path = selected_path
            self.is_using_fallback_weight = using_fallback

            # Clear cached per-camera models so they re-instantiate with the new model weights
            self._camera_models.clear()

            status_msg = (
                f"Active model successfully switched to '{display_name}' "
                f"({'Fallback ' + self.FALLBACK_MODEL_NAME if using_fallback else selected_path.name})"
            )
            logger.info(status_msg)
            return True, status_msg

    def _get_or_create_model_for_camera(self, camera_code: str) -> YOLO:
        """
        Retrieves or instantiates an isolated YOLO model for a given camera stream.
        Guarantees that ByteTrack state for one camera never bleeds into another.
        """
        with self._lock:
            code = camera_code.strip().lower()
            if code not in self._camera_models:
                logger.info(
                    f"Instantiating isolated YOLO tracker for camera '{code}' "
                    f"using model '{self.active_display_name}'"
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
                - 'model_used': String active model display name ('YOLOv26n' or 'YOLOv8s')
                - 'camera_code': String camera identifier
                - 'timestamp': UTC ISO timestamp
        """
        if frame is None or frame.size == 0:
            return {
                "detections": [],
                "inference_ms": 0.0,
                "model_used": self.active_display_name,
                "camera_code": camera_code,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

        # Retrieve isolated camera model instance
        model = self._get_or_create_model_for_camera(camera_code)

        # High-resolution inference timer for academic benchmarking (JICT journal)
        start_time = time.perf_counter()

        try:
            # Run Ultralytics tracking with ByteTrack
            results = model.track(
                source=frame,
                persist=True,
                tracker=self.tracker_config,
                verbose=False,
            )
        except Exception as e:
            logger.error(f"[{camera_code}] Detection/tracking error: {e}")
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            return {
                "detections": [],
                "inference_ms": round(elapsed_ms, 2),
                "model_used": self.active_display_name,
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
        """Returns the current detector service configuration and active models."""
        with self._lock:
            return {
                "active_model": self.active_display_name,
                "active_key": self.active_model_key,
                "weight_filename": self.active_weight_path.name,
                "is_fallback": self.is_using_fallback_weight,
                "tracker_config": Path(self.tracker_config).name,
                "active_camera_pipelines": list(self._camera_models.keys()),
            }


# Application-wide global detector instance
detector_service = DualModelDetector(
    initial_model=settings.DEFAULT_YOLO_MODEL.replace("_best.pt", "").replace(".onnx", "").lower()
)
