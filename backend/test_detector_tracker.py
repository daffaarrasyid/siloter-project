import sys
from pathlib import Path
import cv2
import numpy as np

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.services.detector_tracker import DualModelDetector
from fastapi.testclient import TestClient
from main import app


def test_dual_model_detector():
    print("[1/4] Initializing DualModelDetector...")
    detector = DualModelDetector(initial_model="yolov8s")
    status = detector.get_status()
    print(f"       Initial status: {status}")
    assert status["active_model"] == "YOLOv8s"
    assert "yolov8s_siloter.onnx" in status["weight_filename"]
    print("       Passed: YOLOv8s loaded from ONNX.")

    print("[2/4] Testing model switching to YOLOv26n (with fallback)...")
    success, msg = detector.switch_model("yolov26n")
    print(f"       Switch result: {success}, Message: {msg}")
    assert success is True
    status2 = detector.get_status()
    assert status2["active_model"] == "YOLOv26n"
    print("       Passed: Switched to YOLOv26n successfully.")

    print("[3/4] Testing detect_and_track with frame...")
    # Read a sample frame or create test frame
    sample_video_path = backend_dir / "data_fallback" / "empang_sample.mp4"
    if sample_video_path.exists():
        cap = cv2.VideoCapture(str(sample_video_path))
        ret, frame = cap.read()
        cap.release()
    else:
        frame = np.zeros((1080, 1920, 3), dtype=np.uint8)

    assert frame is not None
    # Test tracking with YOLOv8s custom model
    detector.switch_model("yolov8s")
    results = detector.detect_and_track(frame, camera_code="empang")

    print(f"       Inference latency: {results['inference_ms']} ms")
    print(f"       Model used: {results['model_used']}")
    print(f"       Detections count: {len(results['detections'])}")
    assert "inference_ms" in results
    assert results["model_used"] == "YOLOv8s"
    assert "detections" in results
    print("       Passed: detect_and_track execution and output schema verified.")

    print("[4/4] Testing API Model Endpoints (/api/model/status, /api/model/switch)...")
    with TestClient(app) as client:
        # Check model status
        res_status = client.get("/api/model/status")
        assert res_status.status_code == 200
        print(f"       API /api/model/status: {res_status.json()['active_model']}")

        # Switch to YOLOv8s
        res_switch = client.post("/api/model/switch", json={"model_name": "yolov8"})
        assert res_switch.status_code == 200
        data_switch = res_switch.json()
        print(f"       API /api/model/switch to yolov8: {data_switch['active_model']} ({data_switch['model_weight_file']})")
        assert data_switch["success"] is True
        assert data_switch["active_model"] == "YOLOv8s"

        # Switch to YOLOv26n
        res_switch2 = client.post("/api/model/switch", json={"model_name": "yolov26n"})
        assert res_switch2.status_code == 200
        data_switch2 = res_switch2.json()
        print(f"       API /api/model/switch to yolov26n: {data_switch2['active_model']} ({data_switch2['model_weight_file']})")
        assert data_switch2["success"] is True
        assert data_switch2["active_model"] == "YOLOv26n"

    print("       Passed: API endpoints verified.")


if __name__ == "__main__":
    print("==================================================================")
    print("RUNNING COMPUTER VISION DETECTOR & TRACKER VERIFICATION SUITE")
    print("==================================================================")
    test_dual_model_detector()
    print("==================================================================")
    print("ALL COMPUTER VISION TESTS PASSED SUCCESSFULLY!")
    print("==================================================================")

