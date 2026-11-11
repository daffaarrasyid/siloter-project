import sys
from pathlib import Path
import numpy as np

backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.services.loitering_engine import LoiteringEngine


def test_loitering_engine_full_suite():
    print("==================================================================")
    print("TESTING LOITERING ENGINE SPATIO-TEMPORAL LOGIC & ANNOTATIONS")
    print("==================================================================")

    engine = LoiteringEngine(default_threshold_seconds=3, max_grace_seconds=5)

    # 1. Test ROI Denormalization
    print("[1/5] Testing ROI Denormalization...")
    norm_roi = [[0.1, 0.1], [0.9, 0.1], [0.9, 0.9], [0.1, 0.9]]
    width, height = 1920, 1080
    denorm_pts = engine.denormalize_roi(norm_roi, width, height)
    assert denorm_pts.shape == (4, 1, 2)
    assert (denorm_pts[0][0] == [192, 108]).all()
    assert (denorm_pts[2][0] == [1728, 972]).all()
    print("       Passed: ROI denormalization verified.")

    # 2. Test Anchor Point & PointPolygonTest
    print("[2/5] Testing Bottom-Center Anchor Calculation...")
    # Bbox: [x1, y1, x2, y2] = [200, 300, 400, 600]
    bbox_inside = [200, 300, 400, 600]
    anchor = engine.calculate_bottom_center_anchor(bbox_inside)
    assert anchor == (300, 600)  # (200+400)/2 = 300, y2 = 600
    assert engine.is_point_inside_roi(anchor, denorm_pts) is True

    # Bbox outside ROI: [x1, y1, x2, y2] = [10, 10, 50, 50]
    bbox_outside = [10, 10, 50, 50]
    anchor_out = engine.calculate_bottom_center_anchor(bbox_outside)
    assert engine.is_point_inside_roi(anchor_out, denorm_pts) is False
    print("       Passed: Anchor calculation and ROI containment verified.")

    # 3. Test Micro-Movement & 1 FPS Accumulation
    print("[3/5] Testing Micro-Movement Tolerance & Single Auto-Capture Lock...")
    frame = np.zeros((height, width, 3), dtype=np.uint8)
    cam = "test_cam"

    # Frame 1: Angkot_01 enters ROI
    det_f1 = [{"track_id": "Angkot_01", "raw_track_id": 1, "bbox": [500, 400, 700, 700], "confidence": 0.9}]
    res1 = engine.process_frame(cam, frame, det_f1, norm_roi, threshold_seconds=3)
    s1 = engine.vehicle_timers[cam]["Angkot_01"]
    assert s1.duration_seconds == 1
    assert s1.is_violation is False
    assert len(res1.new_violations) == 0
    print("       Frame 1: Angkot_01 duration = 1s (No violation yet)")

    # Frame 2: Angkot_01 creeps forward (micro-movement: 500->520, 700->710)
    det_f2 = [{"track_id": "Angkot_01", "raw_track_id": 1, "bbox": [520, 410, 720, 710], "confidence": 0.9}]
    res2 = engine.process_frame(cam, frame, det_f2, norm_roi, threshold_seconds=3)
    s2 = engine.vehicle_timers[cam]["Angkot_01"]
    assert s2.duration_seconds == 2
    assert s2.is_violation is False
    print("       Frame 2: Angkot_01 micro-movement tolerated, duration = 2s")

    # Frame 3: Angkot_01 continues creeping, reaches threshold (3s)
    det_f3 = [{"track_id": "Angkot_01", "raw_track_id": 1, "bbox": [530, 415, 730, 715], "confidence": 0.9}]
    res3 = engine.process_frame(cam, frame, det_f3, norm_roi, threshold_seconds=3)
    s3 = engine.vehicle_timers[cam]["Angkot_01"]
    assert s3.duration_seconds == 3
    assert s3.is_violation is True
    assert s3.is_captured is True
    assert len(res3.new_violations) == 1
    assert res3.new_violations[0].track_id == "Angkot_01"
    print("       Frame 3: VIOLATION TRIGGERED! Auto-Capture signal generated.")

    # Frame 4: Angkot_01 still loitering at 4s
    # Single-capture lock MUST prevent duplicate Auto-Capture trigger!
    det_f4 = [{"track_id": "Angkot_01", "raw_track_id": 1, "bbox": [530, 415, 730, 715], "confidence": 0.9}]
    res4 = engine.process_frame(cam, frame, det_f4, norm_roi, threshold_seconds=3)
    s4 = engine.vehicle_timers[cam]["Angkot_01"]
    assert s4.duration_seconds == 4
    assert s4.is_violation is True
    assert len(res4.new_violations) == 0  # No duplicate capture!
    print("       Frame 4: Duration = 4s. Single-capture lock verified (No duplicate capture).")

    # 4. Test Occlusion Grace Period
    print("[4/5] Testing Occlusion Grace Period (5 seconds)...")
    # Frame 5 & 6: Angkot_01 temporarily occluded (not in detections)
    empty_det = []
    engine.process_frame(cam, frame, empty_det, norm_roi, threshold_seconds=3)
    engine.process_frame(cam, frame, empty_det, norm_roi, threshold_seconds=3)
    assert "Angkot_01" in engine.vehicle_timers[cam]
    assert engine.vehicle_timers[cam]["Angkot_01"].duration_seconds == 4
    assert engine.vehicle_timers[cam]["Angkot_01"].missed_frames == 2
    print("       Absent 2 frames: Timer successfully preserved at 4s (Grace period active)")

    # Frame 7: Angkot_01 reappears
    det_f7 = [{"track_id": "Angkot_01", "raw_track_id": 1, "bbox": [540, 420, 740, 720], "confidence": 0.9}]
    engine.process_frame(cam, frame, det_f7, norm_roi, threshold_seconds=3)
    assert engine.vehicle_timers[cam]["Angkot_01"].duration_seconds == 5
    assert engine.vehicle_timers[cam]["Angkot_01"].missed_frames == 0
    print("       Reappeared: Duration resumed to 5s.")

    # Absent for 6 consecutive frames (> 5 seconds grace period) -> should expire
    for _ in range(6):
        engine.process_frame(cam, frame, empty_det, norm_roi, threshold_seconds=3)
    assert "Angkot_01" not in engine.vehicle_timers[cam]
    print("       Absent > 5 seconds: Timer cleanly expired and reset.")

    # 5. Test OpenCV Annotations
    print("[5/5] Testing OpenCV Visual Annotations...")
    test_det = [
        {"track_id": "Angkot_Normal", "raw_track_id": 2, "bbox": [50, 50, 150, 150], "confidence": 0.95},
        {"track_id": "Angkot_Inside", "raw_track_id": 3, "bbox": [600, 400, 800, 700], "confidence": 0.88},
    ]
    res_vis = engine.process_frame(cam, frame, test_det, norm_roi, threshold_seconds=10)
    assert res_vis.annotated_frame.shape == (height, width, 3)
    # Check that pixels were modified (not pure black)
    assert res_vis.annotated_frame.sum() > 0
    print("       Passed: Visual annotations rendered on frame.")

    print("==================================================================")
    print("ALL LOITERING ENGINE TESTS PASSED SUCCESSFULLY!")
    print("==================================================================")


if __name__ == "__main__":
    test_loitering_engine_full_suite()

