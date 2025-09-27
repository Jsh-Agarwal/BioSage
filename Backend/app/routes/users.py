from fastapi import APIRouter, HTTPException, Query, status
from typing import Optional, List
from app.models.user import User, UserCreate, UserUpdate, UserResponse, UserStatus, UserRole
from app.db.mongodb import user_crud
from datetime import datetime
import re

router = APIRouter(prefix="/users", tags=["users"])

def serialize_datetime_fields(data: dict) -> dict:
    """Convert datetime objects to ISO format strings and handle missing fields"""
    if not data:
        return data
    serialized = data.copy()
    for key, value in serialized.items():
        if isinstance(value, datetime):
            serialized[key] = value.isoformat()
    # Ensure required fields exist
    if "created_at" in serialized and isinstance(serialized["created_at"], datetime):
        serialized["created_at"] = serialized["created_at"].isoformat()
    if "last_login" in serialized and isinstance(serialized.get("last_login"), datetime):
        serialized["last_login"] = serialized["last_login"].isoformat()
    if "status" not in serialized:
        serialized["status"] = "active"
    if "role" not in serialized:
        serialized["role"] = "clinician"
    if "_id" in serialized and not isinstance(serialized["_id"], str):
        serialized["_id"] = str(serialized["_id"])
    return serialized

def validate_email_format(email: str) -> bool:
    """Basic email validation"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_role_permissions(current_role: str, target_role: str) -> bool:
    """Validate if current user can manage target role (basic role hierarchy)"""
    role_hierarchy = {
        UserRole.SYSTEM: 3,
        UserRole.ADMIN: 2,
        UserRole.CLINICIAN: 1
    }
    
    # For now, allow all operations (no authentication implemented yet)
    return True

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user_data: UserCreate):
    """Create a new user (simplified - no password hashing for pilot)"""
    try:
        # Validate input data
        if not user_data.name.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Name cannot be empty"
            )
        
        if not validate_email_format(user_data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Invalid email format"
            )
        
        # Check if user with email already exists
        existing_user = await user_crud.find_one({"email": user_data.email.lower()})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, 
                detail="Email already registered"
            )
        
        # Create user data
        user_dict = user_data.model_dump()
        # For pilot: store password as-is (in production, hash it)
        user_dict["password_hash"] = user_dict.pop("password")
        user_dict["email"] = user_dict["email"].lower()  # Store email in lowercase
        user_dict["created_at"] = datetime.utcnow()
        user_dict["status"] = UserStatus.ACTIVE.value  # Set default status
        user_dict["role"] = user_data.role.value  # Ensure enum value is stored
        
        user_id = await user_crud.create(user_dict)
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user"
            )
        created_user = await user_crud.get_by_id(user_id)
        if not created_user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user"
            )
        created_user = serialize_datetime_fields(created_user)
        return UserResponse(**created_user)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/", response_model=List[UserResponse])
async def get_users(
    skip: int = Query(0, ge=0, description="Number of users to skip"),
    limit: int = Query(50, le=100, ge=1, description="Number of users to return"),
    role: Optional[str] = Query(None, description="Filter by user role"),
    status: Optional[str] = Query(None, description="Filter by user status"),
    search: Optional[str] = Query(None, description="Search by name or email")
):
    """Get all users with optional filtering"""
    try:
        filter_dict = {}
        
        if role:
            # Validate role exists
            try:
                UserRole(role)
                filter_dict["role"] = role
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid role: {role}. Valid roles: {[r.value for r in UserRole]}"
                )
        
        if status:
            # Validate status exists
            try:
                UserStatus(status)
                filter_dict["status"] = status
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid status: {status}. Valid statuses: {[s.value for s in UserStatus]}"
                )
        
        if search:
            # Search across name and email
            filter_dict["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}}
            ]
        
        users = await user_crud.get_many(
            filter_dict=filter_dict,
            skip=skip,
            limit=limit,
            sort_by="created_at",
            sort_order=-1
        )
        if users is None:
            users = []
        serialized_users = [serialize_datetime_fields(user) for user in users]
        return [UserResponse(**user) for user in serialized_users]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    """Get user by ID"""
    try:
        user = await user_crud.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="User not found"
            )
        user = serialize_datetime_fields(user)
        return UserResponse(**user)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, user_update: UserUpdate):
    """Update user by ID"""
    try:
        existing_user = await user_crud.get_by_id(user_id)
        if not existing_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="User not found"
            )
        update_data = user_update.model_dump(exclude_unset=True)
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No update data provided"
            )
        if user_update.email:
            if not validate_email_format(user_update.email):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid email format"
                )
            update_data["email"] = user_update.email.lower()
            email_exists = await user_crud.find_one({
                "email": update_data["email"], 
                "_id": {"$ne": user_id}
            })
            if email_exists:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT, 
                    detail="Email already exists"
                )
        if user_update.role:
            update_data["role"] = user_update.role.value
        if user_update.status:
            update_data["status"] = user_update.status.value
        success = await user_crud.update(user_id, update_data)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="Failed to update user"
            )
        updated_user = await user_crud.get_by_id(user_id)
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch updated user"
            )
        updated_user = serialize_datetime_fields(updated_user)
        return UserResponse(**updated_user)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
async def delete_user(user_id: str):
    """Delete user by ID"""
    try:
        existing_user = await user_crud.get_by_id(user_id)
        if not existing_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="User not found"
            )
        success = await user_crud.delete(user_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="Failed to delete user"
            )
        return {
            "message": "User deleted successfully",
            "deleted_user_id": user_id
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/{user_id}/profile", response_model=UserResponse)
async def get_user_profile(user_id: str):
    """Get user profile (same as get_user for now)"""
    return await get_user(user_id)

# Additional endpoint for role management
@router.get("/roles/available")
async def get_available_roles():
    """Get list of available user roles"""
    return {
        "roles": [
            {"value": role.value, "name": role.value.title()} 
            for role in UserRole
        ]
    }

@router.get("/statuses/available")
async def get_available_statuses():
    """Get list of available user statuses"""
    return {
        "statuses": [
            {"value": status.value, "name": status.value.title()} 
            for status in UserStatus
        ]
    }