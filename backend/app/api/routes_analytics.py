from collections import defaultdict
import logging
from typing import Any, Dict
from fastapi import APIRouter

from app.core.supabase_client import get_supabase_client
from app.services.capture_logger import capture_logger

logger = logging.getLogger("siloter.routes_analytics")

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/summary")
def get_analytics_summary() -> Dict[str, Any]:
    """
    Returns aggregated analytical metrics for Recharts visualizations on /analytics:
    - Time-Series traffic congestion patterns by session and hour of day.
    - 3-Camera location congestion comparison (Empang vs Surken vs Balaikota).
    - AI Model inference benchmark comparison (YOLOv26n vs YOLOv8).
    - Human-in-the-loop review validation ratio (Valid vs Invalid vs Pending).
    """
    all_events = []
    supabase = get_supabase_client()

    if supabase:
        try:
            res = (
                supabase.table("violation_events")
                .select("*, camera_configs(camera_code)")
                .execute()
            )
            if res.data:
                for row in res.data:
                    cam = row.get("camera_configs") or {}
                    row["camera_code"] = cam.get("camera_code", "unknown")
                    all_events.append(row)
        except Exception as e:
            logger.warning(f"Error fetching analytics from Supabase ({e}). Using local events.")

    if not all_events:
        all_events = capture_logger._local_event_logs

    # 1. Camera Comparison Breakdown
    camera_counts = {"empang": 0, "surken": 0, "balaikota": 0}

    # 2. Session Category Breakdown
    session_counts = {
        "Rush Hour Pagi": 0,
        "Off-Peak Siang": 0,
        "Rush Hour Sore": 0,
        "Akhir Pekan": 0,
        "Off-Peak Malam": 0,
    }

    # 3. Hourly Histogram (0 to 23)
    hourly_counts = {hour: 0 for hour in range(24)}

    # 4. Model Benchmarks
    model_stats = defaultdict(lambda: {"total_events": 0, "total_ms": 0.0})

    # 5. Validation Stats
    validation_counts = {"Pending": 0, "Valid": 0, "Invalid": 0}

    for ev in all_events:
        # Camera
        cam = ev.get("camera_code", "empang")
        if cam in camera_counts:
            camera_counts[cam] += 1

        # Session
        sess = ev.get("session_type", "Off-Peak Siang")
        if sess in session_counts:
            session_counts[sess] += 1

        # Hour
        detected_at_str = ev.get("detected_at")
        if detected_at_str:
            try:
                # Handle ISO timestamps with Z or offset
                clean_time = detected_at_str.replace("Z", "+00:00")
                from datetime import datetime
                dt = datetime.fromisoformat(clean_time)
                hourly_counts[dt.hour] += 1
            except Exception:
                pass

        # Model benchmark
        m_used = ev.get("model_used", "YOLOv8s")
        inf_ms = float(ev.get("inference_ms") or 0.0)
        model_stats[m_used]["total_events"] += 1
        model_stats[m_used]["total_ms"] += inf_ms

        # Validation
        val_status = ev.get("validation_status", "Pending")
        if val_status in validation_counts:
            validation_counts[val_status] += 1

    # Format model benchmark summaries
    model_benchmarks = []
    for model_name, data in model_stats.items():
        avg_ms = (
            round(data["total_ms"] / data["total_events"], 2)
            if data["total_events"] > 0
            else 0.0
        )
        model_benchmarks.append(
            {
                "model_name": model_name,
                "total_events_detected": data["total_events"],
                "average_inference_ms": avg_ms,
            }
        )

    return {
        "total_violations": len(all_events),
        "camera_comparison": [
            {"camera_code": code, "camera_name": f"Jl. Djuanda - {code.capitalize()}", "violation_count": count}
            for code, count in camera_counts.items()
        ],
        "session_distribution": [
            {"session_type": sess, "count": count}
            for sess, count in session_counts.items()
        ],
        "hourly_time_series": [
            {"hour": f"{h:02d}:00", "count": count}
            for h, count in hourly_counts.items()
        ],
        "model_benchmarks": model_benchmarks,
        "validation_stats": validation_counts,
    }

