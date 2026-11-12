import asyncio
from contextlib import asynccontextmanager
from datetime import datetime
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings, BASE_DIR
from app.core.supabase_client import get_supabase_client
from app.services.stream_manager import stream_manager
from app.services.detector_tracker import detector_service

# Routers
from app.api.routes_stream import router as stream_router
from app.api.routes_config import router as config_router
from app.api.routes_events import router as events_router
from app.api.routes_analytics import router as analytics_router
from app.api.routes_users import router as users_router
from app.api.websocket import router as websocket_router, connection_manager

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("siloter")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan context manager.
    - Startup: initializes event loops, static directories, Supabase client,
      and starts the 1 FPS background camera stream workers across 3 CCTV points.
    - Shutdown: cleanly stops all worker threads and releases OpenCV VideoCapture resources.
    """
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}...")
    logger.info(f"Active YOLO model architecture: {detector_service.active_display_name}")
    logger.info(f"Allowed CORS origins: {settings.CORS_ORIGINS}")

    # Register running asyncio loop in WebSocket connection manager
    connection_manager.set_event_loop(asyncio.get_running_loop())

    # Ensure static directories exist for local captures fallback
    static_dir = BASE_DIR / "static"
    static_dir.mkdir(parents=True, exist_ok=True)
    (static_dir / "captures").mkdir(parents=True, exist_ok=True)

    # Check Supabase status
    supabase = get_supabase_client()
    if supabase:
        logger.info("Supabase client is connected.")
    else:
        logger.warning("Supabase credentials not yet provided. Running in offline/mock mode.")

    # Start CCTV camera stream workers
    logger.info("Starting CCTV camera stream ingestion workers (empang, surken, balaikota)...")
    stream_manager.initialize_default_cameras()
    stream_manager.start_all()

    yield

    # Clean shutdown
    logger.info("Stopping all camera stream workers and releasing VideoCapture resources...")
    stream_manager.stop_all()
    logger.info("SILOTER Backend shutdown complete.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Sistem Informasi dan Deteksi Loitering Angkutan Umum Terpadu - FastAPI Backend",
    lifespan=lifespan,
)

# Setup CORS (Next.js localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for local evidence captures preview
static_path = BASE_DIR / "static"
static_path.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(static_path)), name="static")

# Register API Routers
app.include_router(stream_router)
app.include_router(config_router)
app.include_router(events_router)
app.include_router(analytics_router)
app.include_router(users_router)
app.include_router(websocket_router)


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
        "active_model": detector_service.active_display_name,
        "supabase_configured": supabase_ready,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
