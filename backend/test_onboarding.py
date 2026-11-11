import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from app.api.routes_config import get_cctv_network_stats, get_onboarding_step1, save_onboarding_step1
from app.schemas.payload_schemas import OnboardingStep1Payload

def test_onboarding():
    print("[1] Testing get_cctv_network_stats()...", flush=True)
    stats = get_cctv_network_stats()
    print("  -> CCTV Stats:", stats, flush=True)
    assert stats["total_cctv_network"] == 142

    print("[2] Testing get_onboarding_step1()...", flush=True)
    step1 = get_onboarding_step1()
    print("  -> Step 1 Data:", step1.location_name, step1.trayek_references, flush=True)
    assert step1.location_name == "Pos Pemantauan Empang - Titik A"

    print("[3] Testing save_onboarding_step1()...", flush=True)
    payload = OnboardingStep1Payload(
        location_name="Pos Pemantauan Empang - Titik A",
        sector="Bogor Selatan (Empang, Batutulis, Cipaku)",
        operator_name="Bripka Hendra Santoso",
        operator_nip="19840312 200812 1 004",
        shift="Shift Pagi (06.00–14.00)",
        trayek_references=[
            "02 Sukasari - Bubulak",
            "03 Baranangsiang - Bubulak",
            "14 Pasir Kuda - Sukasari",
        ],
        camera_code="empang",
        is_draft=False,
    )
    saved = save_onboarding_step1(payload)
    print("  -> Save Result:", saved.status, saved.message, flush=True)
    assert saved.status == "success"
    assert saved.location_name == "Pos Pemantauan Empang - Titik A"

    print("\nALL ONBOARDING BACKEND LOGIC TESTS PASSED SUCCESSFULLY!", flush=True)

if __name__ == "__main__":
    test_onboarding()
