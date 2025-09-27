from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
import logging

# Import all route modules
from app.routes.users import router as users_router
from app.routes.patients import router as patients_router
from app.routes.cases import router as cases_router
from app.routes.vitals_labs import router as vitals_labs_router
from app.routes.history import router as history_router
from app.routes.orders import router as orders_router
from app.routes.analysis import router as analysis_router
from app.routes.research import router as research_router
from app.routes.onboarding import router as onboarding_router

# Import database connection
from app.db.connection import connect_to_mongo, close_mongo_connection

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="BioSage Backend API",
    description="Comprehensive medical platform backend with AI-powered diagnostic assistance",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*", "http://localhost:8080", "http://127.0.0.1:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=600
)

# Database connection events
@app.on_event("startup")
async def startup_db_client():
    """Initialize database connection on startup"""
    try:
        await connect_to_mongo()
        logger.info("Database connection established")
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_db_client():
    """Close database connection on shutdown"""
    try:
        await close_mongo_connection()
        logger.info("Database connection closed")
    except Exception as e:
        logger.error(f"Error closing database connection: {e}")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "BioSage Backend API",
        "version": "1.0.0"
    }

# System status endpoint
@app.get("/status")
async def system_status():
    """System status endpoint with database connectivity"""
    try:
        from app.db.connection import db
        # Check if database connection exists
        db_connected = db.database is not None
        
        return {
            "status": "operational",
            "database": "connected" if db_connected else "disconnected",
            "api_version": "1.0.0",
            "endpoints": {
                "users": "/api/v1/users",
                "patients": "/api/v1/patients", 
                "cases": "/api/v1/cases",
                "vitals_labs": "/api/v1/vitals-labs",
                "history": "/api/v1/history",
                "orders": "/api/v1/orders",
                "analysis": "/api/v1/analysis",
                "research": "/api/v1/research"
            }
        }
    except Exception as e:
        logger.error(f"System status check failed: {e}")
        return {
            "status": "error",
            "database": "error",
            "error": str(e)
        }

# Dashboard metrics endpoint
@app.get("/dashboard/metrics")
async def dashboard_metrics():
    """Dashboard metrics for system overview"""
    try:
        from app.db.crud import (
            user_crud, patient_crud, case_crud, vitals_crud, 
            labs_crud, agents_crud, specialist_results_crud
        )
        
        # Get basic counts
        metrics = {
            "users": {
                "total": await user_crud.count({}),
                "active": await user_crud.count({"status": "active"}),
                "doctors": await user_crud.count({"role": "doctor"}),
                "specialists": await user_crud.count({"role": "specialist"})
            },
            "patients": {
                "total": await patient_crud.count({}),
                "active": await patient_crud.count({"status": "active"})
            },
            "cases": {
                "total": await case_crud.count({}),
                "active": await case_crud.count({"status": "active"}),
                "completed": await case_crud.count({"status": "completed"})
            },
            "vitals": {
                "total": await vitals_crud.count({})
            },
            "labs": {
                "total": await labs_crud.count({})
            },
            "ai_analysis": {
                "agents_run": await agents_crud.count({}),
                "specialist_consultations": await specialist_results_crud.count({})
            }
        }
        
        return metrics
        
    except Exception as e:
        logger.error(f"Failed to get dashboard metrics: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve dashboard metrics"
        )

# Include all API routers with prefixes
app.include_router(users_router, prefix="/api/v1")
app.include_router(patients_router, prefix="/api/v1") 
app.include_router(cases_router, prefix="/api/v1")
app.include_router(vitals_labs_router, prefix="/api/v1")
app.include_router(history_router, prefix="/api/v1")
app.include_router(orders_router, prefix="/api/v1")
app.include_router(analysis_router, prefix="/api/v1")
app.include_router(research_router, prefix="/api/v1")
app.include_router(onboarding_router, prefix="/api/v1")  # <-- Add this line

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "BioSage Backend API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/health",
        "status": "/status"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
