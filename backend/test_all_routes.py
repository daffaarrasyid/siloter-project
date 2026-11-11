import os
import sys
from pathlib import Path
import cv2
import numpy as np

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from app.core.config import settings
# Use local fallback mp4 instantly in test suite (avoid BSW network timeout)
settings.STREAM_URL_EMPANG = ""
settings.STREAM_URL_SURKEN = ""
settings.STREAM_URL_BALAIKOTA = ""

from fastapi.testclient import TestClient
from main import app
from app.services.stream_manager import stream_manager
from app.services.capture_logger import capture_logger
from app.schemas.payload_schemas import ValidationStatus

def run_tests():
    print("[1/12] Initializing TestClient...")
    client = TestClient(app)

    # 1. Root & Health Check
    print("[2/12] Testing Root and Health Check endpoints...")
    res_root = client.get("/")
    assert res_root.status_code == 200, f"Expected 200, got {res_root.status_code}"
    assert res_root.json()["service"] == "SILOTER Backend"
    print("  -> GET / PASSED")

    res_health = client.get("/health")
    assert res_health.status_code == 200, f"Expected 200, got {res_health.status_code}"
    health_data = res_health.json()
    assert health_data["status"] == "healthy"
    print(f"  -> GET /health PASSED (Active Model: {health_data['active_model']})")

    # 2. Camera Stream Status
    print("[3/12] Testing Stream Status...")
    res_status = client.get("/api/stream/status/all")
    assert res_status.status_code == 200, f"Expected 200, got {res_status.status_code}"
    statuses = res_status.json()
    assert "empang" in statuses
    assert "surken" in statuses
    assert "balaikota" in statuses
    print("  -> GET /api/stream/status/all PASSED (3 cameras verified)")

    # 3. Stream Generator (MJPEG Stream)
    print("[4/13] Testing MJPEG Live Stream Endpoint...")
    from app.api.routes_stream import mjpeg_frame_generator
    import asyncio

    worker = stream_manager.get_worker("empang")
    if worker:
        sample_frame = np.zeros((480, 640, 3), dtype=np.uint8)
        worker._latest_annotated_frame = (sample_frame, "2026-11-11T20:00:00Z", worker.status)

    async def test_stream():
        gen = mjpeg_frame_generator("empang")
        chunk = await gen.__anext__()
        await gen.aclose()
        return chunk

    chunk = asyncio.run(test_stream())
    assert b"--frame" in chunk
    assert b"Content-Type: image/jpeg" in chunk
    print("  -> MJPEG Frame Generator PASSED (Valid MJPEG multipart stream)")

    # 4. Camera Configurations GET
    print("[5/12] Testing Camera Configs...")
    res_cam = client.get("/api/cameras")
    assert res_cam.status_code == 200
    cam_configs = res_cam.json()
    assert len(cam_configs) == 3
    cam_codes = [c["camera_code"] for c in cam_configs]
    assert "empang" in cam_codes and "surken" in cam_codes and "balaikota" in cam_codes
    print("  -> GET /api/cameras PASSED (Retrieved 3 camera configurations)")

    # 5. Camera Configuration Update PUT (Hot-reload)
    print("[6/12] Testing Camera Config PUT Update...")
    new_roi = [[0.1, 0.1], [0.9, 0.1], [0.9, 0.9], [0.1, 0.9]]
    new_threshold = 45
    update_payload = {
        "roi_polygon": new_roi,
        "threshold_seconds": new_threshold,
        "is_configured": True
    }
    res_update = client.put("/api/cameras/empang/config", json=update_payload)
    assert res_update.status_code == 200
    updated_data = res_update.json()
    assert updated_data["threshold_seconds"] == 45
    assert len(updated_data["roi_polygon"]) == 4
    # Verify live worker updated in memory
    assert worker.threshold_seconds == 45
    assert len(worker.roi_polygon) == 4
    print("  -> PUT /api/cameras/empang/config PASSED (Hot-reloaded in memory)")

    # 6. Model Status and Switcher
    print("[7/12] Testing Model Status and Dynamic Switcher...")
    res_mstatus = client.get("/api/model/status")
    assert res_mstatus.status_code == 200
    print(f"  -> Initial Model: {res_mstatus.json()['active_display_name']}")

    # Switch to YOLOv26n
    res_switch_v26 = client.post("/api/model/switch", json={"model_name": "yolov26n"})
    assert res_switch_v26.status_code == 200
    assert res_switch_v26.json()["success"] is True
    print(f"  -> Switched to: {res_switch_v26.json()['active_model']}")

    # Switch back to YOLOv8s
    res_switch_v8 = client.post("/api/model/switch", json={"model_name": "yolov8"})
    assert res_switch_v8.status_code == 200
    assert res_switch_v8.json()["success"] is True
    print(f"  -> Switched back to: {res_switch_v8.json()['active_model']}")

    # 7. Create Test Violation Events for Events & Analytics
    print("[8/12] Logging synthetic violation events to local event store...")
    dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    
    event1 = capture_logger.log_violation(
        camera_code="empang",
        track_id=101,
        duration_seconds=75,
        frame=dummy_frame,
        bbox=[100, 100, 200, 200],
        model_name="YOLOv8s",
        inference_ms=14.2
    )
    
    event2 = capture_logger.log_violation(
        camera_code="surken",
        track_id=102,
        duration_seconds=90,
        frame=dummy_frame,
        bbox=[150, 150, 250, 250],
        model_name="YOLOv26n",
        inference_ms=18.5
    )
    assert event1 is not None and event2 is not None
    event1_id = event1["id"]
    event2_id = event2["id"]
    print(f"  -> Created Event 1 ID: {event1_id}")
    print(f"  -> Created Event 2 ID: {event2_id}")

    # 8. Events Query GET (with filtering)
    print("[9/12] Testing GET /api/events with filters...")
    res_events_all = client.get("/api/events")
    assert res_events_all.status_code == 200
    all_events = res_events_all.json()
    assert len(all_events) >= 2
    print(f"  -> GET /api/events total count: {len(all_events)}")

    # Filter by camera_code
    res_filtered_cam = client.get("/api/events?camera_code=empang")
    assert res_filtered_cam.status_code == 200
    for ev in res_filtered_cam.json():
        assert ev["camera_code"] == "empang"
    print("  -> Camera filter '?camera_code=empang' PASSED")

    # Filter by validation_status
    res_filtered_status = client.get("/api/events?validation_status=Pending")
    assert res_filtered_status.status_code == 200
    for ev in res_filtered_status.json():
        assert ev["validation_status"] == "Pending"
    print("  -> Status filter '?validation_status=Pending' PASSED")

    # 9. Single Event GET
    print("[10/12] Testing GET /api/events/{event_id}...")
    res_single = client.get(f"/api/events/{event1_id}")
    assert res_single.status_code == 200
    single_data = res_single.json()
    assert single_data["id"] == event1_id
    assert single_data["vehicle_track_id"] == "Angkot_101"
    print("  -> GET /api/events/{event_id} PASSED")

    # 10. Human-in-the-Loop Validation PATCH
    print("[11/12] Testing PATCH /api/events/{event_id}/validate...")
    # Validate event 1 as 'Valid'
    res_val1 = client.patch(
        f"/api/events/{event1_id}/validate",
        json={"validation_status": "Valid", "reviewer_notes": "Jelas ngetem depan BTM"}
    )
    assert res_val1.status_code == 200
    val_data1 = res_val1.json()
    assert val_data1["validation_status"] == "Valid"
    print("  -> Validation to 'Valid' PASSED")

    # Validate event 2 as 'Invalid'
    res_val2 = client.patch(
        f"/api/events/{event2_id}/validate",
        json={"validation_status": "Invalid", "reviewer_notes": "Macet lampu merah"}
    )
    assert res_val2.status_code == 200
    val_data2 = res_val2.json()
    assert val_data2["validation_status"] == "Invalid"
    print("  -> Validation to 'Invalid' PASSED")

    # 11. Analytics Summary GET
    print("[12/12] Testing GET /api/analytics/summary...")
    res_analytics = client.get("/api/analytics/summary")
    assert res_analytics.status_code == 200
    analytics_data = res_analytics.json()
    assert "total_violations" in analytics_data
    assert "camera_comparison" in analytics_data
    assert "session_distribution" in analytics_data
    assert "hourly_time_series" in analytics_data
    assert "model_benchmarks" in analytics_data
    assert "validation_stats" in analytics_data
    assert analytics_data["validation_stats"]["Valid"] >= 1
    assert analytics_data["validation_stats"]["Invalid"] >= 1
    print(f"  -> Analytics summary: {analytics_data['validation_stats']}")
    print("  -> GET /api/analytics/summary PASSED")

    # 12. Onboarding Setup Step 1 & CCTV Stats
    print("[13/13] Testing Onboarding Setup Step 1 & CCTV Network Stats...")
    res_stats = client.get("/api/cctv/stats")
    assert res_stats.status_code == 200
    stats_data = res_stats.json()
    assert stats_data["total_cctv_network"] == 142
    print(f"  -> GET /api/cctv/stats PASSED (Total: {stats_data['total_cctv_network']} CCTV)")

    res_onb_get = client.get("/api/onboarding/step1")
    assert res_onb_get.status_code == 200
    onb_data = res_onb_get.json()
    assert "location_name" in onb_data
    assert "trayek_references" in onb_data
    print("  -> GET /api/onboarding/step1 PASSED")

    # Test POST save/draft
    onb_payload = {
        "location_name": "Pos Pemantauan Empang - Titik A",
        "sector": "Bogor Selatan (Empang, Batutulis, Cipaku)",
        "operator_name": "Bripka Hendra Santoso",
        "operator_nip": "19840312 200812 1 004",
        "shift": "Shift Pagi (06.00–14.00)",
        "trayek_references": [
            "02 Sukasari - Bubulak",
            "03 Baranangsiang - Bubulak",
            "14 Pasir Kuda - Sukasari",
        ],
        "camera_code": "empang",
        "is_draft": False,
    }
    res_onb_post = client.post("/api/onboarding/step1", json=onb_payload)
    assert res_onb_post.status_code == 200
    assert res_onb_post.json()["status"] == "success"
    print("  -> POST /api/onboarding/step1 PASSED")

    print("\n==============================================")
    print("ALL 13 ENDPOINT TESTS PASSED SUCCESSFULLY!")
    print("==============================================")

if __name__ == "__main__":
    run_tests()

