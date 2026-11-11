from contextlib import asynccontextmanager
from datetime import datetime
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.supabase_client import get_supabase_client

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("siloter")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown routines."""
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}...")
    logger.info(f"Default YOLO model: {settings.DEFAULT_YOLO_MODEL}")
    logger.info(f"Allowed CORS origins: {settings.CORS_ORIGINS}")

    # Check Supabase status
    supabase = get_supabase_client()
    if supabase:
        logger.info("Supabase client is connected.")
    else:
        logger.warning("Supabase credentials not yet provided. Running in offline/mock mode.")

    yield

    logger.info("Shutting down SILOTER Backend...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Sistem Informasi dan Deteksi Loitering Angkutan Umum Terpadu - FastAPI Backend",
    lifespan=lifespan,
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Root"])
def root():
    """Root landing endpoint."""
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "health_url": "/health",
        "status": "online",
    }


@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint for Docker, k8s, or Next.js uptime monitoring."""
    supabase_ready = get_supabase_client() is not None
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "active_model": settings.DEFAULT_YOLO_MODEL,
        "supabase_configured": supabase_ready,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }

