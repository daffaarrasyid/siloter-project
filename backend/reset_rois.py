import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from app.core.supabase_client import get_supabase_client

def main():
    print("=== SILOTER ROI RESET UTILITY ===")
    supabase = get_supabase_client()
    if not supabase:
        print("[ERROR] Supabase client could not be initialized. Check .env configuration.")
        return

    try:
        res = supabase.table("camera_configs").update({
            "roi_polygon": [],
            "is_configured": False
        }).neq("camera_code", "dummy").execute()
        
        print(f"[SUCCESS] Successfully reset ROI polygons to [] (empty) and is_configured to false in Supabase.")
        if res.data:
            print(f"[INFO] Updated {len(res.data)} camera records:")
            for row in res.data:
                print(f"  - {row.get('camera_code')}: is_configured={row.get('is_configured')}, roi={row.get('roi_polygon')}")
    except Exception as e:
        print(f"[ERROR] Failed to update Supabase camera_configs: {e}")

if __name__ == "__main__":
    main()

