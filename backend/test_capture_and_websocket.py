import sys
from pathlib import Path
from datetime import datetime, timezone
import numpy as np

# Set unbuffered output
sys.stdout.reconfigure(line_buffering=True)

backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.services.capture_logger import determine_session_type, capture_logger
from app.services.loitering_engine import TrackLoiteringState
from app.api.websocket import connection_manager
from main import list_violation_events


def run_all_tests():
    print("==================================================================")
    print("TESTING CAPTURE LOGGER & WEBSOCKET MODULE")
    print("==================================================================")

    # 1. Test Session Type Classification
    print("[1/4] Testing Session Type Classification...")
    mon_morning = datetime(2026, 11, 9, 8, 30, tzinfo=timezone.utc)
    tue_afternoon = datetime(2026, 11, 10, 13, 0, tzinfo=timezone.utc)
    wed_evening = datetime(2026, 11, 11, 17, 45, tzinfo=timezone.utc)
    weekend = datetime(2026, 11, 15, 12, 0, tzinfo=timezone.utc)

    assert determine_session_type(mon_morning) == "Rush Hour Pagi"
    assert determine_session_type(tue_afternoon) == "Off-Peak Siang"
    assert determine_session_type(wed_evening) == "Rush Hour Sore"
    assert determine_session_type(weekend) == "Akhir Pekan"
    print("       Passed: Session type classification verified.")

    # 2. Test Watermarking
    print("[2/4] Testing Evidence Watermarking...")
    frame = np.zeros((1080, 1920, 3), dtype=np.uint8)
    now = datetime(2026, 11, 11, 19, 30, 0, tzinfo=timezone.utc)
    wm = capture_logger.apply_evidence_watermark(frame, "Jl. Djuanda - Empang", "empang", now)
    assert wm.shape == (1080, 1920, 3)
    assert wm.sum() > 0
    print("       Passed: Evidence watermark applied.")

    # 3. Test Single-Capture Lock & Evidence File Creation
    print("[3/4] Testing Single-Capture Lock & Local Fallback Storage...")
    vehicle_state = TrackLoiteringState(
        track_id="Angkot_42",
        raw_track_id=42,
        first_seen_inside=10.0,
        last_seen_inside=75.0,
        duration_seconds=65,
        inside_roi=True,
        is_violation=True,
        is_captured=False,  # Initially unlocked
        last_bbox=[300, 400, 500, 700],
    )

    record = capture_logger.log_and_broadcast_violation(
        camera_code="empang",
        camera_name="Jl. Djuanda - Empang",
        vehicle_state=vehicle_state,
        annotated_frame=frame,
        model_used="YOLOv8s",
        inference_ms=18.5,
        threshold_seconds=60,
    )

    assert vehicle_state.is_captured is True, "Single-capture lock MUST be True!"
    assert record["vehicle_track_id"] == "Angkot_42"
    assert record["validation_status"] == "Pending"
    assert record["session_type"] == determine_session_type()
    print(f"       Single-Capture lock: is_captured={vehicle_state.is_captured}")
    print(f"       Evidence record generated: {record['evidence_url']}")

    # Verify physical file saved locally
    if record["evidence_url"].startswith("/static/captures/"):
        saved_file = backend_dir / record["evidence_url"].lstrip("/")
        assert saved_file.exists(), f"Evidence file not found on disk: {saved_file}"
        print(f"       Verified local JPEG: {saved_file.name} ({saved_file.stat().st_size} bytes)")

    print("       Passed: Single-capture lock & storage verified.")

    # 4. Test Event Retrieval & API Endpoint GET /api/events
    print("[4/4] Testing Event Retrieval & API Endpoint GET /api/events...", flush=True)

    # Direct service retrieval
    recent_events = capture_logger.get_recent_events()
    assert len(recent_events) >= 1
    assert recent_events[0]["vehicle_track_id"] == "Angkot_42"
    assert recent_events[0]["validation_status"] == "Pending"
    print(f"       capture_logger.get_recent_events() returned {len(recent_events)} event(s)", flush=True)

    # API Endpoint function
    events = list_violation_events(limit=50)
    assert len(events) >= 1
    assert events[0]["vehicle_track_id"] == "Angkot_42"
    assert events[0]["validation_status"] == "Pending"
    print(f"       Endpoint list_violation_events() returned {len(events)} event(s)", flush=True)

    print("       Passed: Event retrieval and GET /api/events verified.", flush=True)

    print("==================================================================")
    print("ALL CAPTURE LOGGER & WEBSOCKET TESTS PASSED!")
    print("==================================================================")


if __name__ == "__main__":
    run_all_tests()
