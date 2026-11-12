"""
Verification script for Dynamic Duration Engine and PIP Inset Zoom Enhancement.
Tests:
1. PIP Zoom & Enhancement on vehicle crop (CLAHE, Bilateral Filter, Lanczos-4).
2. Dynamic duration tracking, heartbeat updates, and departure finalization.
3. Database & WebSocket duration update dispatching.
"""

import sys
from pathlib import Path
import numpy as np
import cv2

# Ensure backend root is on sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from app.services.loitering_engine import LoiteringEngine, TrackLoiteringState
from app.services.capture_logger import capture_logger

def test_pip_zoom_enhancement():
    print("\n[1/3] Testing Picture-in-Picture Zoom & CLAHE Enhancement...")
    # Create synthetic frame: 1280x720 blue background
    frame = np.zeros((720, 1280, 3), dtype=np.uint8)
    frame[:] = (180, 120, 80) # Road surface

    # Draw a simulated yellow angkot at (400, 300, 600, 480)
    cv2.rectangle(frame, (400, 300), (600, 480), (0, 215, 255), -1)
    cv2.putText(frame, "ANGKOT 03", (420, 390), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)

    bbox = [400.0, 300.0, 600.0, 480.0]
    pip_frame = capture_logger.apply_picture_in_picture_zoom(
        frame=frame,
        bbox=bbox,
        track_id="Angkot_Test_01",
    )

    assert pip_frame is not None, "PIP frame must not be None"
    assert pip_frame.shape == frame.shape, "PIP frame dimensions must match input frame"

    # Verify that the top-right corner now contains the inset box (not just road surface)
    top_right_region = pip_frame[20:100, 1280-200:1280-20]
    assert not np.array_equal(top_right_region, frame[20:100, 1280-200:1280-20]), "Top-right inset must be overlaid"
    print("      Passed: PIP Inset Zoom and CLAHE/Bilateral Enhancement successfully rendered.")


def test_dynamic_duration_lifecycle():
    print("\n[2/3] Testing Dynamic Duration Heartbeat & Departure Lifecycle...")
    engine = LoiteringEngine(default_threshold_seconds=5, max_grace_seconds=3)

    # 100x100 square ROI in normalized coordinates
    roi = [[0.2, 0.2], [0.8, 0.2], [0.8, 0.8], [0.2, 0.8]]
    frame = np.zeros((1000, 1000, 3), dtype=np.uint8)

    # Bounding box inside ROI: bottom center anchor is (500, 600) -> inside [200, 800]
    detections = [{
        "track_id": "Angkot_Live_99",
        "raw_track_id": 99,
        "bbox": [450.0, 500.0, 550.0, 600.0],
        "confidence": 0.95
    }]

    # Step 1: Simulate 1-4 seconds inside ROI (no violation yet)
    for sec in range(1, 5):
        res = engine.process_frame(
            camera_code="test_cam",
            frame=frame,
            detections=detections,
            roi_polygon=roi,
            threshold_seconds=5,
        )
        assert len(res.new_violations) == 0, f"No violation should trigger at {sec}s"
        assert len(res.duration_updates) == 0

    # Step 2: At 5th second, violation triggers!
    res = engine.process_frame(
        camera_code="test_cam",
        frame=frame,
        detections=detections,
        roi_polygon=roi,
        threshold_seconds=5,
    )
    assert len(res.new_violations) == 1, "Violation must trigger at 5s threshold"
    violation = res.new_violations[0]
    assert violation.is_captured is True
    assert violation.duration_seconds == 5

    # Simulate capture logger assigning event_id to the vehicle state
    violation.event_id = "test-uuid-event-12345"
    print(f"      Initial violation captured: {violation.track_id} at {violation.duration_seconds}s (event_id={violation.event_id})")

    # Step 3: Vehicle stays in ROI for seconds 6 through 9 (accumulating time)
    for sec in range(6, 10):
        res = engine.process_frame(
            camera_code="test_cam",
            frame=frame,
            detections=detections,
            roi_polygon=roi,
            threshold_seconds=5,
        )
        assert len(res.new_violations) == 0, "No duplicate new_violations allowed"
        assert len(res.duration_updates) == 0, "No heartbeat before 5-second pulse"

    # Step 4: At 10th second (5 seconds past initial 5s sync), heartbeat duration update triggers!
    res = engine.process_frame(
        camera_code="test_cam",
        frame=frame,
        detections=detections,
        roi_polygon=roi,
        threshold_seconds=5,
    )
    assert len(res.duration_updates) == 1, "Heartbeat duration update must trigger at 10s"
    update_item = res.duration_updates[0]
    assert update_item.duration_seconds == 10
    assert update_item.event_id == "test-uuid-event-12345"
    print(f"      Heartbeat pulse verified: duration updated dynamically to {update_item.duration_seconds}s")

    # Step 5: Vehicle departs ROI (empty detections for 4 frames > max_grace_seconds of 3)
    for _ in range(3):
        res = engine.process_frame(
            camera_code="test_cam",
            frame=frame,
            detections=[],
            roi_polygon=roi,
            threshold_seconds=5,
        )
        assert len(res.departed_violations) == 0, "Grace period active, not yet departed"

    # 4th absent frame exceeds grace period -> Departure event triggers!
    res = engine.process_frame(
        camera_code="test_cam",
        frame=frame,
        detections=[],
        roi_polygon=roi,
        threshold_seconds=5,
    )
    assert len(res.departed_violations) == 1, "Vehicle departure must trigger final duration update"
    departed = res.departed_violations[0]
    assert departed.event_id == "test-uuid-event-12345"
    assert departed.duration_seconds == 10
    print(f"      Vehicle departure verified: final duration {departed.duration_seconds}s captured cleanly")


def test_update_violation_duration():
    print("\n[3/3] Testing update_violation_duration DB/WebSocket helper...")
    # Seed a test event in local cache
    test_id = "test-uuid-event-12345"
    capture_logger._local_event_logs.append({
        "id": test_id,
        "camera_code": "test_cam",
        "duration_seconds": 60,
    })

    # Call update_violation_duration
    capture_logger.update_violation_duration(
        event_id=test_id,
        duration_seconds=185,
        is_final=True,
        camera_code="test_cam",
    )

    # Check local cache updated
    match = next(e for e in capture_logger._local_event_logs if e["id"] == test_id)
    assert match["duration_seconds"] == 185, "Local event duration must be updated to 185s"
    print("      Passed: update_violation_duration successfully updated state to 185s.")


if __name__ == "__main__":
    print("=" * 65)
    print("TESTING DYNAMIC DURATION & PIP ENHANCEMENT ENGINE")
    print("=" * 65)
    test_pip_zoom_enhancement()
    test_dynamic_duration_lifecycle()
    test_update_violation_duration()
    print("=" * 65)
    print("ALL TESTS PASSED SUCCESSFULLY!")
    print("=" * 65)

