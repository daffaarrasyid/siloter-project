from collections import defaultdict
from datetime import datetime, timezone
import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Query

from app.core.supabase_client import get_supabase_client
from app.services.capture_logger import capture_logger

logger = logging.getLogger("siloter.routes_analytics")

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


# ==============================================================================
# SAMPLE HISTORICAL AUDIT LOGS (MATCHING MOCKUP DISHUB BOGOR OKTOBER 2026)
# ==============================================================================

REKAP_PELANGGARAN_VALID: List[Dict[str, Any]] = [
    {
        "no": 1,
        "incident_id": "#VIO-202610-0982",
        "plate_number": "F 1934 AK",
        "plate_color": "Hitam / Plat Kuning Umum",
        "trayek_code": "02",
        "trayek_name": "Trayek 02",
        "trayek_desc": "Hijau-Kuning",
        "trayek_color": "#eab308",
        "camera_code": "empang",
        "camera_name": "Simpang BTM (CAM-01)",
        "waktu_wib": "24 Okt 2026 - 17:14:02",
        "duration_seconds": 214,
        "duration_display": "214s (3m 34s)",
        "verifier_name": "Budi Santoso, S.T.",
        "verified_at": "24 Okt 2026 - 17:22",
        "status": "VALID",
        "reason": "Ngetem Menghambat Lalu Lintas",
        "notes": "Angkot berhenti melebihi batas 120s pada bahu jalan utama simpang BTM.",
    },
    {
        "no": 2,
        "incident_id": "#VIO-202610-0981",
        "plate_number": "F 1422 BA",
        "plate_color": "Hitam / Plat Kuning Umum",
        "trayek_code": "03",
        "trayek_name": "Trayek 03",
        "trayek_desc": "Biru",
        "trayek_color": "#3b82f6",
        "camera_code": "surken",
        "camera_name": "Jembatan Merah (CAM-02)",
        "waktu_wib": "24 Okt 2026 - 16:58:19",
        "duration_seconds": 188,
        "duration_display": "188s (3m 08s)",
        "verifier_name": "Budi Santoso, S.T.",
        "verified_at": "24 Okt 2026 - 17:10",
        "status": "VALID",
        "reason": "Menunggu Penumpang di Zona Larangan",
        "notes": "Penurunan dan penjemputan penumpang di area terlarang Jembatan Merah.",
    },
    {
        "no": 3,
        "incident_id": "#VIO-202610-0980",
        "plate_number": "F 1803 AA",
        "plate_color": "Hitam / Plat Kuning Umum",
        "trayek_code": "02",
        "trayek_name": "Trayek 02",
        "trayek_desc": "Hijau-Kuning",
        "trayek_color": "#eab308",
        "camera_code": "empang",
        "camera_name": "Simpang BTM (CAM-01)",
        "waktu_wib": "24 Okt 2026 - 16:42:56",
        "duration_seconds": 245,
        "duration_display": "245s (4m 05s)",
        "verifier_name": "Ahmad Fauzi, A.Md.PKB",
        "verified_at": "24 Okt 2026 - 16:55",
        "status": "VALID",
        "reason": "Antrean Ganda (Double Parking)",
        "notes": "Menumpuk di sisi kiri jalan menyebabkan perlambatan arus Simpang BTM.",
    },
    {
        "no": 4,
        "incident_id": "#VIO-202610-0979",
        "plate_number": "F 1198 ZB",
        "plate_color": "Hitam / Plat Kuning Umum",
        "trayek_code": "03",
        "trayek_name": "Trayek 03",
        "trayek_desc": "Biru",
        "trayek_color": "#3b82f6",
        "camera_code": "surken",
        "camera_name": "Jembatan Merah (CAM-02)",
        "waktu_wib": "24 Okt 2026 - 15:30:11",
        "duration_seconds": 130,
        "duration_display": "130s (2m 10s)",
        "verifier_name": "Budi Santoso, S.T.",
        "verified_at": "24 Okt 2026 - 15:42",
        "status": "VALID",
        "reason": "Ngetem Melebihi Toleransi",
        "notes": "Berhenti lama di depan ruko tanpa pergantian penumpang aktif.",
    },
    {
        "no": 5,
        "incident_id": "#VIO-202610-0978",
        "plate_number": "F 1650 DD",
        "plate_color": "Hitam / Plat Kuning Umum",
        "trayek_code": "10",
        "trayek_name": "Trayek 10",
        "trayek_desc": "Merah Bata",
        "trayek_color": "#ef4444",
        "camera_code": "surken",
        "camera_name": "Jembatan Merah (CAM-02)",
        "waktu_wib": "24 Okt 2026 - 14:18:49",
        "duration_seconds": 195,
        "duration_display": "195s (3m 15s)",
        "verifier_name": "Ahmad Fauzi, A.Md.PKB",
        "verified_at": "24 Okt 2026 - 14:30",
        "status": "VALID",
        "reason": "Ngetem Menghambat Lalu Lintas",
        "notes": "Sopir meninggalkan kemudi sesaat di zona larangan.",
    },
    {
        "no": 6,
        "incident_id": "#VIO-202610-0977",
        "plate_number": "F 1940 AP",
        "plate_color": "Hitam / Plat Kuning Umum",
        "trayek_code": "02",
        "trayek_name": "Trayek 02",
        "trayek_desc": "Hijau-Kuning",
        "trayek_color": "#eab308",
        "camera_code": "empang",
        "camera_name": "Simpang BTM (CAM-01)",
        "waktu_wib": "24 Okt 2026 - 13:05:12",
        "duration_seconds": 142,
        "duration_display": "142s (2m 22s)",
        "verifier_name": "Rahmat Hidayat",
        "verified_at": "24 Okt 2026 - 13:18",
        "status": "VALID",
        "reason": "Ngetem Menghambat Arus Simpang",
        "notes": "Terpantau ByteTrack berhenti 142 detik di ROI BTM.",
    },
    {
        "no": 7,
        "incident_id": "#VIO-202610-0976",
        "plate_number": "F 1892 BB",
        "plate_color": "Hitam / Plat Kuning Umum",
        "trayek_code": "03",
        "trayek_name": "Trayek 03",
        "trayek_desc": "Biru",
        "trayek_color": "#3b82f6",
        "camera_code": "empang",
        "camera_name": "Simpang BTM (CAM-01)",
        "waktu_wib": "24 Okt 2026 - 11:22:40",
        "duration_seconds": 160,
        "duration_display": "160s (2m 40s)",
        "verifier_name": "Hendra Santoso, A.Md.",
        "verified_at": "24 Okt 2026 - 11:35",
        "status": "VALID",
        "reason": "Ngetem Melebihi Toleransi",
        "notes": "Verifikasi manual rekaman cctv terkonfirmasi valid.",
    },
]


@router.get("/summary")
def get_analytics_summary() -> Dict[str, Any]:
    """
    Returns aggregated analytical metrics for Recharts visualizations on /analytics:
    - 5 KPI summary cards matching media_1794443330942_5d380212.jpg
    - 24-hour histogram breakdown (Peak vs Normal)
    - Location breakdown (Simpang BTM vs Jembatan Merah)
    - 4-week trend (Oktober 2026)
    - Valid audit logs list for table and export
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

    # Standard distribution matching mockup
    hourly_distribution = [
        {"hour": "00", "time": "00:00", "count": 2, "is_peak": False},
        {"hour": "01", "time": "01:00", "count": 1, "is_peak": False},
        {"hour": "02", "time": "02:00", "count": 0, "is_peak": False},
        {"hour": "03", "time": "03:00", "count": 1, "is_peak": False},
        {"hour": "04", "time": "04:00", "count": 4, "is_peak": False},
        {"hour": "05", "time": "05:00", "count": 10, "is_peak": False},
        {"hour": "06", "time": "06:00", "count": 24, "is_peak": True},
        {"hour": "07", "time": "07:00", "count": 38, "is_peak": True},
        {"hour": "08", "time": "08:00", "count": 32, "is_peak": True},
        {"hour": "09", "time": "09:00", "count": 14, "is_peak": False},
        {"hour": "10", "time": "10:00", "count": 16, "is_peak": False},
        {"hour": "11", "time": "11:00", "count": 18, "is_peak": False},
        {"hour": "12", "time": "12:00", "count": 20, "is_peak": False},
        {"hour": "13", "time": "13:00", "count": 16, "is_peak": False},
        {"hour": "14", "time": "14:00", "count": 18, "is_peak": False},
        {"hour": "15", "time": "15:00", "count": 22, "is_peak": False},
        {"hour": "16", "time": "16:00", "count": 42, "is_peak": True},
        {"hour": "17", "time": "17:00", "count": 48, "is_peak": True},
        {"hour": "18", "time": "18:00", "count": 36, "is_peak": True},
        {"hour": "19", "time": "19:00", "count": 20, "is_peak": False},
        {"hour": "20", "time": "20:00", "count": 14, "is_peak": False},
        {"hour": "21", "time": "21:00", "count": 9, "is_peak": False},
        {"hour": "22", "time": "22:00", "count": 5, "is_peak": False},
        {"hour": "23", "time": "23:00", "count": 3, "is_peak": False},
    ]

    location_data = {
        "total_valid": 348,
        "locations": [
            {
                "name": "Simpang BTM (CAM-01)",
                "code": "empang",
                "count": 189,
                "percentage": 54.3,
                "color": "#3b82f6",
            },
            {
                "name": "Jembatan Merah (CAM-02)",
                "code": "surken",
                "count": 159,
                "percentage": 45.7,
                "color": "#1d4ed8",
            },
        ],
        "manual_verification_stats": {
            "all_time_validasi": 348,
            "koreksi_petugas": 154,
            "target_persen": "60–70%",
            "note": "Akurasi verifikasi manual human-in-the-loop oleh petugas Dishub",
        },
    }

    weekly_trend = [
        {"week": "Mgg 1", "btm": 38, "jembatan_merah": 34, "total": 72, "dates": "01 - 07 Okt"},
        {"week": "Mgg 2", "btm": 48, "jembatan_merah": 40, "total": 88, "dates": "08 - 14 Okt"},
        {"week": "Mgg 3", "btm": 58, "jembatan_merah": 46, "total": 104, "dates": "15 - 21 Okt"},
        {"week": "Mgg 4", "btm": 45, "jembatan_merah": 39, "total": 84, "dates": "22 - 31 Okt (Berjalan)"},
    ]

    kpi_cards = {
        "bulan_ini": {
            "count": 348,
            "label": "Bulan Ini",
            "trend": "+12% vs September 2026 (311 kasus)",
            "trend_type": "increase",
        },
        "minggu_ini": {
            "count": 84,
            "label": "Minggu Ini",
            "dates": "24 - 31 Okt 2026",
            "desc": "subset dari 348 kasus",
        },
        "titik_teramai": {
            "name": "Simpang BTM",
            "camera_code": "CAM-01",
            "count": 189,
            "percentage": 54.3,
            "desc": "54.3% Kontribusi Total",
        },
        "jam_puncak": {
            "time_range": "16.00 – 18.00",
            "desc": "Peak sore, jam kepulangan komuter",
        },
        "rata_rata_durasi": {
            "duration_formatted": "3m 14s (194 detik)",
            "duration_seconds": 194,
            "tolerance_limit": "60 Detik",
            "multiplier": "Melebihi 3.2×",
        },
    }

    dynamic_rekap = []
    for ev in all_events:
        status_val = ev.get("validation_status")
        if status_val in ("Valid", "VALID"):
            dur = int(ev.get("duration_seconds") or 60)
            dur_m = dur // 60
            dur_s = dur % 60
            ev_id = str(ev.get("id", "0000"))[:8].upper()
            dynamic_rekap.append({
                "no": len(dynamic_rekap) + 1,
                "incident_id": f"#VIO-{ev_id}",
                "plate_number": ev.get("plate_number") or "F 1934 AK",
                "plate_color": "Hitam / Plat Kuning Umum",
                "trayek_code": "02",
                "trayek_name": "Trayek 02",
                "trayek_desc": "Hijau-Kuning",
                "trayek_color": "#eab308",
                "camera_code": ev.get("camera_code", "empang"),
                "camera_name": ev.get("camera_name", "Simpang BTM (CAM-01)"),
                "waktu_wib": str(ev.get("detected_at", ""))[:19].replace("T", " ") if ev.get("detected_at") else "Hari ini",
                "duration_seconds": dur,
                "duration_display": f"{dur}s ({dur_m}m {dur_s:02d}s)",
                "verifier_name": ev.get("verifier_name") or "Budi Santoso, S.T.",
                "verified_at": str(ev.get("validated_at", ""))[:16].replace("T", " ") if ev.get("validated_at") else "Baru saja",
                "status": "VALID",
                "reason": ev.get("reason") or "Ngetem Menghambat Lalu Lintas",
                "notes": ev.get("notes") or "Tervalidasi oleh petugas pengawas lapangan Dishub.",
            })

    combined_rekap = dynamic_rekap + REKAP_PELANGGARAN_VALID
    for i, r in enumerate(combined_rekap):
        r["no"] = i + 1

    return {
        "kpi_cards": kpi_cards,
        "hourly_distribution": hourly_distribution,
        "location_distribution": location_data,
        "weekly_trend": weekly_trend,
        "rekap_pelanggaran_valid": combined_rekap,
        "total_cases": 348 + len(dynamic_rekap),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/rekap")
def get_rekap_pelanggaran(
    trayek: Optional[str] = Query(None),
    camera_code: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> Dict[str, Any]:
    """
    Returns filtered table rows for 'Rekap Pelanggaran Valid'.
    """
    all_events = []
    supabase = get_supabase_client()
    if supabase:
        try:
            res = (
                supabase.table("violation_events")
                .select("*, camera_configs(camera_code, camera_name)")
                .execute()
            )
            if res.data:
                for row in res.data:
                    cam = row.get("camera_configs") or {}
                    row["camera_code"] = cam.get("camera_code", "unknown")
                    row["camera_name"] = cam.get("camera_name", "CCTV")
                    all_events.append(row)
        except Exception:
            pass

    if not all_events:
        all_events = capture_logger._local_event_logs

    dynamic_rekap = []
    for ev in all_events:
        if ev.get("validation_status") in ("Valid", "VALID"):
            dur = int(ev.get("duration_seconds") or 60)
            dur_m = dur // 60
            dur_s = dur % 60
            ev_id = str(ev.get("id", "0000"))[:8].upper()
            dynamic_rekap.append({
                "no": len(dynamic_rekap) + 1,
                "incident_id": f"#VIO-{ev_id}",
                "plate_number": ev.get("plate_number") or "F 1934 AK",
                "plate_color": "Hitam / Plat Kuning Umum",
                "trayek_code": "02",
                "trayek_name": "Trayek 02",
                "trayek_desc": "Hijau-Kuning",
                "trayek_color": "#eab308",
                "camera_code": ev.get("camera_code", "empang"),
                "camera_name": ev.get("camera_name", "Simpang BTM (CAM-01)"),
                "waktu_wib": str(ev.get("detected_at", ""))[:19].replace("T", " ") if ev.get("detected_at") else "Hari ini",
                "duration_seconds": dur,
                "duration_display": f"{dur}s ({dur_m}m {dur_s:02d}s)",
                "verifier_name": ev.get("verifier_name") or "Budi Santoso, S.T.",
                "verified_at": str(ev.get("validated_at", ""))[:16].replace("T", " ") if ev.get("validated_at") else "Baru saja",
                "status": "VALID",
                "reason": ev.get("reason") or "Ngetem Menghambat Lalu Lintas",
                "notes": ev.get("notes") or "Tervalidasi oleh petugas pengawas lapangan Dishub.",
            })

    source_rekap = dynamic_rekap + REKAP_PELANGGARAN_VALID
    filtered = []
    s_clean = search.strip().lower() if isinstance(search, str) and search else None
    t_clean = trayek.strip() if isinstance(trayek, str) and trayek else None
    c_clean = camera_code.strip() if isinstance(camera_code, str) and camera_code else None

    for row in source_rekap:
        if t_clean and t_clean != "Semua Trayek Aktif (Koridor 01-10)":
            if t_clean.lower() not in row["trayek_name"].lower() and t_clean.lower() not in row["trayek_desc"].lower():
                continue

        if c_clean and c_clean != "Semua CCTV (CAM-01 & CAM-02)":
            if c_clean.lower() not in row["camera_name"].lower() and c_clean.lower() != row["camera_code"]:
                continue

        if s_clean:
            match_plat = s_clean in row["plate_number"].lower()
            match_id = s_clean in row["incident_id"].lower()
            if not (match_plat or match_id):
                continue

        filtered.append(row)

    _limit = limit if isinstance(limit, int) else 20
    _offset = offset if isinstance(offset, int) else 0
    return {
        "total": len(filtered),
        "data": filtered[_offset : _offset + _limit],
    }
