from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.server_api import ServerApi
from typing import Optional
import os
from dotenv import load_dotenv
import certifi
import logging

load_dotenv()
logger = logging.getLogger(__name__)

MONGO_URI = os.getenv(
    "MONGO_URI",
    "mongodb+srv://jshagarwal15_db_user:FrjpC3SJ4CSSVNws@cluster0.h0b2icg.mongodb.net/biosage?retryWrites=true&w=majority&appName=Cluster0"
)
MONGO_DB = os.getenv("MONGO_DB", "biosage")
MONGO_TLS_INSECURE = os.getenv("MONGO_TLS_INSECURE", "false").lower() == "true"
CONNECT_TIMEOUT_MS = int(os.getenv("MONGO_CONNECT_TIMEOUT_MS", "20000"))
SOCKET_TIMEOUT_MS = int(os.getenv("MONGO_SOCKET_TIMEOUT_MS", "20000"))

class Database:
    client: Optional[AsyncIOMotorClient] = None
    database: Optional[AsyncIOMotorDatabase] = None

db = Database()

async def get_database() -> AsyncIOMotorDatabase:
    if db.database is None:
        await connect_to_mongo()
    return db.database

async def connect_to_mongo():
    """Create database connection to MongoDB Atlas with TLS handling."""
    if db.client is not None:
        return  # already connected
    try:
        tls_kwargs = {}
        if MONGO_TLS_INSECURE:
            # Last resort only (corporate SSL interception)
            tls_kwargs.update(dict(tlsAllowInvalidCertificates=True, tlsAllowInvalidHostnames=True))
            logger.warning("MONGO_TLS_INSECURE=true: accepting invalid TLS certificates (NOT for production).")
        else:
            tls_kwargs.update(dict(tlsCAFile=certifi.where()))
        db.client = AsyncIOMotorClient(
            MONGO_URI,
            server_api=ServerApi('1'),
            connectTimeoutMS=CONNECT_TIMEOUT_MS,
            socketTimeoutMS=SOCKET_TIMEOUT_MS,
            retryWrites=True,
            **tls_kwargs
        )
        db.database = db.client[MONGO_DB]
        await db.client.admin.command('ping')
        logger.info(f"Connected to MongoDB Atlas database '{MONGO_DB}'")
    except Exception as e:
        logger.error(f"MongoDB Atlas connection failed: {e}")
        # Cleanup to allow retry
        if db.client:
            try:
                db.client.close()
            except Exception:
                pass
        db.client = None
        db.database = None
        raise

async def close_mongo_connection():
    """Close database connection"""
    if db.client:
        try:
            db.client.close()
            logger.info("Disconnected from MongoDB Atlas")
        finally:
            db.client = None
            db.database = None

# Collection names constants (unchanged)
COLLECTIONS = {
    "users": "users",
    "patients": "patients",
    "cases": "cases",
    "vitals": "vitals",
    "labs": "labs",
    "medical_history": "medical_history",
    "social_history": "social_history",
    "orders": "orders",
    "audit_logs": "audit_logs",
    "system_events": "system_events",
    "agents": "agents",
    "specialist_results": "specialist_results",
    "integrated_results": "integrated_results",
    "feedback": "feedback",
    "research_suggestions": "research_suggestions",
    "clinical_trials": "clinical_trials",
    "evidence": "evidence",
    "collaborations": "collaborations"
}