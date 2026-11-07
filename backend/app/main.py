"""FastAPI Application Entry Point for AI Predictive Maintenance System."""

import logging
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.routes import router
from app.core.config import settings
from app.db.session import init_db

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("predictive_maintenance")

# Path to compiled frontend assets
BASE_ROOT = Path(__file__).resolve().parent.parent.parent
FRONTEND_DIST = BASE_ROOT / "frontend" / "dist"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context for startup initialization and shutdown cleanup."""
    logger.info("Initializing AI-Powered Predictive Maintenance System backend...")
    # Initialize database tables if accessible
    init_db()
    yield
    logger.info("Predictive Maintenance backend shutdown completed.")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Backend for industrial AI-Powered Predictive Maintenance System. "
        "Provides machine registration, real-time telemetry ingestion, Random Forest ML failure forecasting, "
        "and PostgreSQL database persistence for machines and prediction history."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS middleware for future frontend or dashboard integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(router)

# Mount frontend production build if available
if FRONTEND_DIST.exists() and (FRONTEND_DIST / "assets").exists():
    app.mount(
        "/assets",
        StaticFiles(directory=str(FRONTEND_DIST / "assets")),
        name="assets",
    )

    @app.get("/dashboard", include_in_schema=False)
    @app.get("/ui", include_in_schema=False)
    def serve_frontend_dashboard():
        """Serve the compiled industrial single-page application dashboard."""
        return FileResponse(str(FRONTEND_DIST / "index.html"))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
