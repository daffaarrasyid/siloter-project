from pathlib import Path
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base backend directory
BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    PROJECT_NAME: str = "SILOTER Backend"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    API_V1_STR: str = "/api"

    # CORS Configuration
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        elif isinstance(v, list):
            return v
        return ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Supabase Credentials (PostgreSQL & Storage)
    SUPABASE_URL: str = "https://zbgbsffibkuvpazxjlsa.supabase.co"
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_STORAGE_BUCKET: str = "violation-evidence"

    # AI & Computer Vision Models
    DEFAULT_YOLO_MODEL: str = "yolov26n_best.pt"
    MODELS_DIR: str = "models"

    # BSW Kota Bogor CCTV Live HLS Streams (.m3u8)
    STREAM_URL_EMPANG: str = "https://bsw.kotabogor.go.id/live/empang.m3u8"
    STREAM_URL_SURKEN: str = "https://bsw.kotabogor.go.id/live/surken.m3u8"
    STREAM_URL_BALAIKOTA: str = "https://bsw.kotabogor.go.id/live/balaikota.m3u8"

    # Local Fallback Sample Videos
    FALLBACK_VIDEO_EMPANG: str = "data_fallback/empang_sample.mp4"
    FALLBACK_VIDEO_SURKEN: str = "data_fallback/surken_sample.mp4"
    FALLBACK_VIDEO_BALAIKOTA: str = "data_fallback/balaikota_sample.mp4"

    # Loitering Detection Parameters
    DEFAULT_THRESHOLD_SECONDS: int = 60
    MAX_FPS: int = 1
    OCCLUSION_GRACE_SECONDS: int = 5

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()

