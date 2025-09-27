from app.db.connection import get_database, COLLECTIONS

class UserCRUD:
    def __init__(self, collection_name):
        self.collection_name = collection_name
        self.collection = None

    async def init(self):
        db = await get_database()
        self.collection = db[self.collection_name]

    async def find_one(self, filter_dict):
        if self.collection is None:
            await self.init()
        return await self.collection.find_one(filter_dict)

    async def create(self, user_dict):
        if self.collection is None:
            await self.init()
        result = await self.collection.insert_one(user_dict)
        return str(result.inserted_id)

    async def get_by_id(self, user_id):
        from bson import ObjectId
        if self.collection is None:
            await self.init()
        try:
            return await self.collection.find_one({"_id": ObjectId(user_id)})
        except Exception:
            return None

    async def get_many(self, filter_dict=None, skip=0, limit=50, sort_by="created_at", sort_order=-1):
        if self.collection is None:
            await self.init()
        filter_dict = filter_dict or {}
        cursor = self.collection.find(filter_dict).sort(sort_by, sort_order).skip(skip).limit(limit)
        return [doc async for doc in cursor]

    async def update(self, user_id, update_data):
        from bson import ObjectId
        if self.collection is None:
            await self.init()
        result = await self.collection.update_one({"_id": ObjectId(user_id)}, {"$set": update_data})
        return result.modified_count > 0

    async def delete(self, user_id):
        from bson import ObjectId
        if self.collection is None:
            await self.init()
        result = await self.collection.delete_one({"_id": ObjectId(user_id)})
        return result.deleted_count > 0

user_crud = UserCRUD(COLLECTIONS["users"])
