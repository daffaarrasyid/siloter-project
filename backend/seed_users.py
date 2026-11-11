import os
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from app.core.config import settings
from app.core.supabase_client import get_supabase_client

SEED_USERS = [
    {
        "email": "admin@siloter.bogor.go.id",
        "username": "admin",
        "password": "Password123!",
        "full_name": "Administrator Dishub Kota Bogor",
        "role": "admin",
        "preferred_camera": "empang",
    },
    {
        "email": "operator@siloter.bogor.go.id",
        "username": "operator",
        "password": "Password123!",
        "full_name": "Petugas Operator TMC Dishub",
        "role": "operator",
        "preferred_camera": "empang",
    },
]

def seed_users():
    print(f"Connecting to Supabase at: {settings.SUPABASE_URL}")
    supabase = get_supabase_client()
    if not supabase:
        print("[ERROR] Supabase client could not be initialized. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.")
        return

    for user_info in SEED_USERS:
        email = user_info["email"]
        password = user_info["password"]
        full_name = user_info["full_name"]
        role = user_info["role"]
        username = user_info["username"]

        print(f"\nProcessing user: {email} ({username})...")

        try:
            # Check if user already exists in auth.users
            # List users via admin API
            users_res = supabase.auth.admin.list_users()
            existing_user = None
            if hasattr(users_res, 'users'):
                user_list = users_res.users
            elif isinstance(users_res, list):
                user_list = users_res
            else:
                user_list = getattr(users_res, 'data', [])

            for u in user_list:
                if getattr(u, 'email', None) == email or (isinstance(u, dict) and u.get('email') == email):
                    existing_user = u
                    break

            user_id = None
            if existing_user:
                user_id = existing_user.id if hasattr(existing_user, 'id') else existing_user.get('id')
                print(f"  -> User already exists in auth.users with ID: {user_id}")
            else:
                # Create user in auth.users
                create_res = supabase.auth.admin.create_user({
                    "email": email,
                    "password": password,
                    "email_confirm": True,
                    "user_metadata": {
                        "full_name": full_name,
                        "role": role,
                        "username": username
                    }
                })
                created_user = getattr(create_res, 'user', None) or create_res
                user_id = created_user.id if hasattr(created_user, 'id') else created_user.get('id')
                print(f"  -> Successfully created user in auth.users with ID: {user_id}")

            # Upsert into public.users_profile
            if user_id:
                profile_data = {
                    "id": str(user_id),
                    "full_name": full_name,
                    "role": role,
                    "preferred_camera": user_info.get("preferred_camera", "empang"),
                }
                res_profile = supabase.table("users_profile").upsert(profile_data).execute()
                print(f"  -> Profile updated in public.users_profile for {full_name}")

        except Exception as e:
            print(f"  -> [WARNING/ERROR] Error creating user {email}: {e}")

    print("\n==============================================")
    print("USER SEEDING COMPLETED!")
    print("Account credentials:")
    print("1. Admin:")
    print("   Email: admin@siloter.bogor.go.id  |  Username: admin")
    print("   Password: Password123!")
    print("2. Operator:")
    print("   Email: operator@siloter.bogor.go.id | Username: operator")
    print("   Password: Password123!")
    print("==============================================")

if __name__ == "__main__":
    seed_users()

