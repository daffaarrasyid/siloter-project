import sys
from pathlib import Path
import cv2
import numpy as np

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.services.detector_tracker import VehicleDetectorTracker, detector_service


def test_yolov8s_onnx_detector():
    print("[1/3] Initializing VehicleDetectorTracker locked to yolov8s_siloter.onnx...")
    detector = VehicleDetectorTracker(weight_file="yolov8s_siloter.onnx")
    status = detector.get_status()
    print(f"       Status: {status}")
    assert status["active_model"] == "YOLOv8s"
    assert status["weight_filename"] == "yolov8s_siloter.onnx"
    assert status["format"] == "ONNX"
    assert status["is_fallback"] is False
    print("       Passed: YOLOv8s loaded exclusively from ONNX without fallback.")

    print("[2/3] Testing rejection of deprecated models...")
    success, msg = detector.switch_model("yolov26n")
    print(f"       Switch request to yolov26n: success={success}, msg={msg}")
    assert success is False
    # Verify yolov8s remains active
    status2 = detector.get_status()
    assert status2["active_model"] == "YOLOv8s"
    assert status2["weight_filename"] == "yolov8s_siloter.onnx"
    print("       Passed: Deprecated model switch cleanly rejected; YOLOv8s ONNX remains locked.")

    print("[3/3] Testing detect_and_track on test frame with ByteTrack...")
    sample_video_path = backend_dir / "data_fallback" / "empang_sample.mp4"
    if sample_video_path.exists():
        cap = cv2.VideoCapture(str(sample_video_path))
        ret, frame = cap.read()
        cap.release()
    else:
        frame = np.zeros((720, 1280, 3), dtype=np.uint8)

    assert frame is not None
    results = detector.detect_and_track(frame, camera_code="empang")

    print(f"       Inference latency: {results['inference_ms']} ms")
    print(f"       Model used: {results['model_used']}")
    print(f"       Model weight: {results['model_weight']}")
    print(f"       Detections count: {len(results['detections'])}")
    assert "inference_ms" in results
    assert results["model_used"] == "YOLOv8s"
    assert results["model_weight"] == "yolov8s_siloter.onnx"
    assert "detections" in results
    print("       Passed: detect_and_track executed successfully on ONNX runtime with ByteTrack.")


if __name__ == "__main__":
    print("==================================================================")
    print("RUNNING YOLOV8S ONNX COMPUTER VISION & TRACKER TEST")
    print("==================================================================")
    test_yolov8s_onnx_detector()
    print("==================================================================")
    print("ALL YOLOV8S ONNX TESTS PASSED SUCCESSFULLY!")
    print("==================================================================")
