import sys
from pathlib import Path
import time

# Ensure backend directory is in python path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.services.stream_manager import CameraStreamWorker, StreamManager
from app.schemas.payload_schemas import CameraStatus
from fastapi.testclient import TestClient
from main import app


def test_camera_worker_fallback_and_throttling():
    print("[1/5] Testing CameraStreamWorker with fallback video...")
    worker = CameraStreamWorker(
        camera_code="empang",
        camera_name="Jl. Djuanda - Empang",
        stream_url=None,  # Force immediate fallback
        fallback_path="data_fallback/empang_sample.mp4",
        target_fps=1.0,
    )

    worker.start()
    for _ in range(60):
        if worker.get_latest_frame()[0] is not None:
            break
        time.sleep(0.25)

    frame, ts, status = worker.get_latest_frame()
    info = worker.get_info()
    print(f"       Worker status: {status.value}")
    print(f"       Resolution: {info['resolution']['width']}x{info['resolution']['height']}")
    assert status == CameraStatus.FALLBACK_MODE, f"Expected Fallback_Mode, got {status}"
    assert frame is not None, "Frame should not be None"
    assert worker.width == 1920, f"Expected 1920, got {worker.width}"
    assert worker.height == 1080, f"Expected 1080, got {worker.height}"

    # Verify throttling over ~2 seconds
    c1 = worker.frame_count
    time.sleep(2.1)
    c2 = worker.frame_count
    diff = c2 - c1
    print(f"       Frames extracted in 2.1s: {diff} (target: ~2 frames at 1 FPS)")
    assert 1 <= diff <= 3, f"Throttling out of bounds: {diff}"

    worker.stop()
    print("       Passed: Fallback video and 1 FPS throttling verified.")


def test_balaikota_resolution_and_denormalization():
    print("[2/5] Testing Balaikota resolution (704x576) & ROI denormalization...")
    worker = CameraStreamWorker(
        camera_code="balaikota",
        camera_name="Jl. Djuanda - Balaikota",
        stream_url=None,
        fallback_path="data_fallback/balaikota_sample.mp4",
        target_fps=1.0,
    )
    worker.start()
    time.sleep(1.2)

    assert worker.width == 704, f"Expected 704, got {worker.width}"
    assert worker.height == 576, f"Expected 576, got {worker.height}"

    # Denormalize normalized polygon
    norm_polygon = [[0.25, 0.35], [0.75, 0.35], [0.85, 0.90], [0.15, 0.90]]
    pts = worker.denormalize_polygon(norm_polygon)
    assert pts.shape == (4, 1, 2), f"Expected shape (4, 1, 2), got {pts.shape}"

    # Center point (0.5, 0.5) in 704x576 -> (352, 288)
    px, py = worker.denormalize_point(0.5, 0.5)
    assert px == 352 and py == 288, f"Expected (352, 288), got ({px}, {py})"

    worker.stop()
    print("       Passed: Balaikota resolution and denormalization verified.")


def test_fault_isolation():
    print("[3/5] Testing fault isolation between camera streams (NFR-02)...")
    worker1 = CameraStreamWorker(
        camera_code="surken",
        camera_name="Jl. Djuanda - Surken",
        stream_url=None,
        fallback_path="data_fallback/surken_sample.mp4",
        target_fps=1.0,
    )
    worker2 = CameraStreamWorker(
        camera_code="balaikota",
        camera_name="Jl. Djuanda - Balaikota",
        stream_url=None,
        fallback_path="data_fallback/balaikota_sample.mp4",
        target_fps=1.0,
    )
    worker1.start()
    worker2.start()
    time.sleep(1.2)

    # Stop worker 1 (simulating crash or disconnect)
    worker1.stop()
    time.sleep(0.5)

    assert worker1.status == CameraStatus.OFFLINE
    # Worker 2 should still be happily running in fallback mode
    f2, _, s2 = worker2.get_latest_frame()
    assert s2 == CameraStatus.FALLBACK_MODE
    assert f2 is not None

    worker2.stop()
    print("       Passed: Worker 1 stop did not crash Worker 2.")


def test_stream_manager():
    print("[4/5] Testing StreamManager orchestrator...")
    mgr = StreamManager()
    mgr.initialize_default_cameras()
    statuses = mgr.get_all_statuses()

    assert "empang" in statuses
    assert "surken" in statuses
    assert "balaikota" in statuses
    print(f"       Registered cameras: {list(statuses.keys())}")
    print("       Passed: StreamManager initialized.")


def test_api_endpoints():
    print("[5/5] Testing FastAPI endpoints (/health, /api/cameras/status)...")
    with TestClient(app) as client:
        res_health = client.get("/health")
        assert res_health.status_code == 200
        health_data = res_health.json()
        print(f"       /health status: {health_data['status']}")
        assert health_data["status"] == "healthy"

        res_cameras = client.get("/api/cameras/status")
        assert res_cameras.status_code == 200
        cameras_data = res_cameras.json()
        print(f"       /api/cameras/status returned {len(cameras_data)} cameras")
        assert "empang" in cameras_data

    print("       Passed: Endpoints returned 200 OK.")


if __name__ == "__main__":
    print("==================================================================")
    print("RUNNING SILOTER STREAM MANAGER & ENDPOINTS VERIFICATION SUITE")
    print("==================================================================")
    test_camera_worker_fallback_and_throttling()
    test_balaikota_resolution_and_denormalization()
    test_fault_isolation()
    test_stream_manager()
    test_api_endpoints()
    print("==================================================================")
    print("ALL TESTS PASSED SUCCESSFULLY!")
    print("==================================================================")

