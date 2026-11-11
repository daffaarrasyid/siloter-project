import logging
from typing import Optional
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger(__name__)

_supabase_client: Optional[Client] = None


def get_supabase_client() -> Optional[Client]:
    """
    Initializes and returns a singleton Supabase Client instance.
    Uses SUPABASE_SERVICE_ROLE_KEY to perform backend operations
    (reading/updating camera_configs, inserting violation_events,
    and uploading auto-capture photos to Supabase Storage).
    """
    global _supabase_client

    if _supabase_client is not None:
        return _supabase_client

    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        logger.warning(
            "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing or empty. "
            "Database and Storage operations will be unavailable until credentials are provided."
        )
        return None

    try:
        _supabase_client = create_client(
            supabase_url=settings.SUPABASE_URL,
            supabase_key=settings.SUPABASE_SERVICE_ROLE_KEY,
        )
        logger.info("Supabase client initialized successfully.")
        return _supabase_client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        return None


def get_storage_bucket(bucket_name: Optional[str] = None):
    """
    Convenience accessor for Supabase Storage bucket.
    Defaults to settings.SUPABASE_STORAGE_BUCKET ('evidence').
    """
    client = get_supabase_client()
    if not client:
        raise RuntimeError("Supabase client is not configured. Check SUPABASE_SERVICE_ROLE_KEY.")

    target_bucket = bucket_name or settings.SUPABASE_STORAGE_BUCKET
    return client.storage.from_(target_bucket)

