"""
PandemicNet AI - FastAPI Backend
Main application entry point
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from backend.config import get_settings
from backend.database import init_db, db
from backend.services.ml_service import ml_service
from backend.routers import individuals, contacts, infections, graph
from backend.utils.seed_data import seed_database

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("🚀 Starting PandemicNet AI...")

    try:
        # Initialize database
        init_db()
        logger.info("✅ Database initialized")

        # Train ML model with synthetic data if not already trained
        try:
            ml_service.train_model()
            logger.info("✅ ML model ready")
        except Exception as e:
            logger.warning(f"⚠️ ML model training skipped: {e}")

        logger.info("✅ PandemicNet AI is ready!")

    except Exception as e:
        logger.error(f"❌ Startup failed: {e}")
        raise

    yield

    # Shutdown
    logger.info("🛑 Shutting down PandemicNet AI...")
    db.close()
    logger.info("✅ Shutdown complete")


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Real-world pandemic network simulation and visualization",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Root endpoint
@app.get("/")
async def root():
    """API root with welcome message"""
    return {
        "message": "Welcome to PandemicNet AI",
        "version": settings.app_version,
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        result = db.execute_query("RETURN 1 as status")
        db_status = "healthy" if result else "unhealthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "database": db_status,
        "ml_model": "loaded" if ml_service.model else "not_loaded"
    }


@app.post("/seed")
async def seed_data(num_individuals: int = 50):
    """
    Seed the database with test data
    ⚠️ Use only for development/testing
    """
    if not settings.debug:
        raise HTTPException(
            status_code=403,
            detail="Seeding is only available in debug mode"
        )

    try:
        result = seed_database(num_individuals)
        return result
    except Exception as e:
        logger.error(f"Seeding failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ml/train")
async def train_ml_model():
    """Train or retrain the ML model"""
    try:
        result = ml_service.train_model()
        return result
    except Exception as e:
        logger.error(f"ML training failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Include routers
app.include_router(individuals.router)
app.include_router(contacts.router)
app.include_router(infections.router)
app.include_router(graph.router)

# Phase 3: Agent control router
try:
    from backend.routers import agents

    app.include_router(agents.router)
    logger.info("✅ Agent control endpoints loaded")
except ImportError:
    logger.warning("⚠️ Agent endpoints not available (Phase 3 not installed)")


# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return {
        "error": "Not Found",
        "message": str(exc.detail) if hasattr(exc, 'detail') else "Resource not found",
        "path": str(request.url)
    }


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    logger.error(f"Internal error: {exc}")
    return {
        "error": "Internal Server Error",
        "message": "An unexpected error occurred",
        "debug": str(exc) if settings.debug else None
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
        log_level="info"
    )
