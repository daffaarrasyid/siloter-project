import sys
from pathlib import Path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from app.api.routes_users import (
    get_user_stats,
    get_users,
    create_user,
    UserCreatePayload,
)
from app.api.routes_analytics import (
    get_analytics_summary,
    get_rekap_pelanggaran,
)

def test_unit():
    print("1. Testing get_user_stats()...")
    stats = get_user_stats()
    print("User stats:", stats.model_dump())
    assert stats.total_personnel >= 14
    assert stats.admins >= 3
    assert stats.field_officers >= 8
    assert stats.verifiers >= 3

    print("2. Testing get_users()...")
    users = get_users(limit=5)
    print(f"Retrieved {len(users)} users.")
    assert len(users) == 5
    assert users[0].full_name == "Budi Santoso, S.T."

    print("3. Testing create_user()...")
    payload = UserCreatePayload(
        full_name="Kurnia Wijaya, S.T.",
        nip="199805122022031001",
        email="kurnia.wijaya@kotabogor.go.id",
        role="Operator CCTV",
        placement="Pos Balaikota",
        status="Aktif",
    )
    new_user = create_user(payload)
    print("Created user:", new_user.id, new_user.full_name)
    assert new_user.full_name == "Kurnia Wijaya, S.T."

    print("4. Testing get_analytics_summary()...")
    summary = get_analytics_summary()
    assert "kpi_cards" in summary
    assert "hourly_distribution" in summary
    assert "weekly_trend" in summary
    assert "rekap_pelanggaran_valid" in summary
    print("Bulan ini count:", summary["kpi_cards"]["bulan_ini"]["count"])
    print("Total hourly points:", len(summary["hourly_distribution"]))

    print("5. Testing get_rekap_pelanggaran()...")
    rekap = get_rekap_pelanggaran(limit=5)
    print("Rekap total:", rekap["total"])
    assert len(rekap["data"]) == 5

    print("\n[SUCCESS] ALL USERS & ANALYTICS UNIT TESTS PASSED!")

if __name__ == "__main__":
    test_unit()
