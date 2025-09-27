from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from bson import ObjectId
from typing import List, Dict, Any, Optional
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Use your Atlas URI
MONGO_URI = os.getenv(
    "MONGO_URI",
    "mongodb+srv://jshagarwal15_db_user:FrjpC3SJ4CSSVNws@cluster0.h0b2icg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
)
MONGO_DB = os.getenv("MONGO_DB", "biosage")

# Initialize client and database
client = AsyncIOMotorClient(MONGO_URI)
database = client[MONGO_DB]

class BaseCRUD:
    def __init__(self, collection_name: str):
        self.collection_name = collection_name
        self.collection = database[collection_name]
    
    async def create(self, data: dict) -> str:
        """Create a new document"""
        result = await self.collection.insert_one(data)
        return str(result.inserted_id)
    
    async def get_by_id(self, item_id: str) -> Optional[dict]:
        """Get document by ID"""
        try:
            if not ObjectId.is_valid(item_id):
                return None
            
            doc = await self.collection.find_one({"_id": ObjectId(item_id)})
            if doc:
                doc["_id"] = str(doc["_id"])
                # Convert ObjectId fields to strings
                for key, value in doc.items():
                    if isinstance(value, ObjectId):
                        doc[key] = str(value)
            return doc
        except Exception as e:
            print(f"Error in get_by_id: {str(e)}")
            return None
    
    async def find_one(self, filter_dict: dict) -> Optional[dict]:
        """Find one document by filter"""
        try:
            doc = await self.collection.find_one(filter_dict)
            if doc:
                doc["_id"] = str(doc["_id"])
                # Convert ObjectId fields to strings
                for key, value in doc.items():
                    if isinstance(value, ObjectId):
                        doc[key] = str(value)
            return doc
        except Exception as e:
            print(f"Error in find_one: {str(e)}")
            return None
    
    async def find_by_field(self, field: str, value: Any) -> List[dict]:
        """Find documents by field value"""
        try:
            cursor = self.collection.find({field: value})
            docs = []
            async for doc in cursor:
                doc["_id"] = str(doc["_id"])
                # Convert ObjectId fields to strings
                for key, val in doc.items():
                    if isinstance(val, ObjectId):
                        doc[key] = str(val)
                docs.append(doc)
            return docs
        except Exception as e:
            print(f"Error in find_by_field: {str(e)}")
            return []
    
    async def get_many(
        self, 
        filter_dict: dict = None,
        skip: int = 0, 
        limit: int = 50,
        sort_by: str = "_id",
        sort_order: int = -1
    ) -> List[dict]:
        """Get multiple documents with pagination and sorting"""
        try:
            filter_dict = filter_dict or {}
            
            cursor = self.collection.find(filter_dict).skip(skip).limit(limit).sort(sort_by, sort_order)
            docs = []
            async for doc in cursor:
                doc["_id"] = str(doc["_id"])
                # Convert ObjectId fields to strings
                for key, value in doc.items():
                    if isinstance(value, ObjectId):
                        doc[key] = str(value)
                docs.append(doc)
            return docs
        except Exception as e:
            print(f"Error in get_many: {str(e)}")
            return []
    
    async def update(self, item_id: str, update_data: dict) -> bool:
        """Update document by ID"""
        try:
            if not ObjectId.is_valid(item_id):
                return False
                
            result = await self.collection.update_one(
                {"_id": ObjectId(item_id)},
                {"$set": update_data}
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"Error in update: {str(e)}")
            return False
    
    async def delete(self, item_id: str) -> bool:
        """Delete document by ID"""
        try:
            if not ObjectId.is_valid(item_id):
                return False
                
            result = await self.collection.delete_one({"_id": ObjectId(item_id)})
            return result.deleted_count > 0
        except Exception as e:
            print(f"Error in delete: {str(e)}")
            return False
    
    async def count(self, filter_dict: dict = None) -> int:
        """Count documents matching filter"""
        try:
            filter_dict = filter_dict or {}
            return await self.collection.count_documents(filter_dict)
        except Exception as e:
            print(f"Error in count: {str(e)}")
            return 0

# Initialize CRUD instances for all collections
user_crud = BaseCRUD("users")
patient_crud = BaseCRUD("patients")
case_crud = BaseCRUD("cases")
vitals_crud = BaseCRUD("vitals")
labs_crud = BaseCRUD("labs")
medical_history_crud = BaseCRUD("medical_history")
social_history_crud = BaseCRUD("social_history")
orders_crud = BaseCRUD("orders")
research_suggestions_crud = BaseCRUD("research_suggestions")
clinical_trials_crud = BaseCRUD("clinical_trials")
evidence_crud = BaseCRUD("evidence")
collaborations_crud = BaseCRUD("collaborations")
agents_crud = BaseCRUD("agents")
audit_logs_crud = BaseCRUD("audit_logs")
system_events_crud = BaseCRUD("system_events")
specialist_results_crud = BaseCRUD("specialist_results")
integrated_results_crud = BaseCRUD("integrated_results")
feedback_crud = BaseCRUD("feedback")