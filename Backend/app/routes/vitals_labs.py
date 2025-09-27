from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from app.models.vitals_labs import (
    Vitals, VitalsCreate, VitalsUpdate, VitalsResponse,
    Labs, LabsCreate, LabsUpdate, LabsResponse
)
from app.db import vitals_crud, labs_crud, case_crud
from datetime import datetime
from bson import ObjectId

router = APIRouter(tags=["medical-data"])

def serialize_datetime_fields(data: dict) -> dict:
    """Convert datetime objects to ISO format strings for vitals/labs dicts"""
    if not data:
        return data
    serialized = data.copy()
    for key, value in serialized.items():
        if isinstance(value, datetime):
            serialized[key] = value.isoformat()
    if "_id" in serialized and not isinstance(serialized["_id"], str):
        serialized["_id"] = str(serialized["_id"])
    if "case_id" in serialized and not isinstance(serialized["case_id"], str):
        serialized["case_id"] = str(serialized["case_id"])
    return serialized

# Vitals endpoints
@router.post("/cases/{case_id}/vitals", response_model=VitalsResponse)
async def create_vitals(case_id: str, vitals_data: VitalsCreate):
    """Create vitals for a case"""
    # Try to find by _id first, then by case_id field
    case = None
    try:
        case = await case_crud.get_by_id(case_id)
    except Exception:
        case = None
    if not case:
        case = await case_crud.find_one({"case_id": case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Create vitals data
    vitals_dict = vitals_data.model_dump()
    # Use the actual MongoDB _id for case_id reference
    vitals_dict["case_id"] = case["_id"]
    vitals_dict["timestamp"] = datetime.utcnow()
    
    vitals_id = await vitals_crud.create(vitals_dict)
    created_vitals = await vitals_crud.get_by_id(vitals_id)
    created_vitals = serialize_datetime_fields(created_vitals)
    
    return VitalsResponse(**created_vitals)

@router.get("/cases/{case_id}/vitals", response_model=List[VitalsResponse])
async def get_case_vitals(
    case_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100)
):
    """Get all vitals for a case"""
    # Try to find by _id first, then by case_id field
    case = None
    try:
        case = await case_crud.get_by_id(case_id)
    except Exception:
        case = None
    if not case:
        case = await case_crud.find_one({"case_id": case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Use the actual MongoDB _id for querying vitals
    vitals = await vitals_crud.get_many(
        filter_dict={"case_id": case["_id"]},
        skip=skip,
        limit=limit,
        sort_by="timestamp",
        sort_order=-1
    )
    return [VitalsResponse(**serialize_datetime_fields(vital)) for vital in vitals]

@router.get("/vitals/{vitals_id}", response_model=VitalsResponse)
async def get_vitals(vitals_id: str):
    """Get vitals by ID"""
    vitals = await vitals_crud.get_by_id(vitals_id)
    if not vitals:
        raise HTTPException(status_code=404, detail="Vitals not found")
    
    vitals = serialize_datetime_fields(vitals)
    return VitalsResponse(**vitals)

@router.put("/vitals/{vitals_id}", response_model=VitalsResponse)
async def update_vitals(vitals_id: str, vitals_update: VitalsUpdate):
    """Update vitals by ID"""
    # Check if vitals exist
    existing_vitals = await vitals_crud.get_by_id(vitals_id)
    if not existing_vitals:
        raise HTTPException(status_code=404, detail="Vitals not found")
    
    # Update vitals
    update_data = vitals_update.model_dump(exclude_unset=True)
    success = await vitals_crud.update(vitals_id, update_data)
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update vitals")
    
    updated_vitals = await vitals_crud.get_by_id(vitals_id)
    updated_vitals = serialize_datetime_fields(updated_vitals)
    return VitalsResponse(**updated_vitals)

@router.delete("/vitals/{vitals_id}")
async def delete_vitals(vitals_id: str):
    """Delete vitals by ID"""
    success = await vitals_crud.delete(vitals_id)
    if not success:
        raise HTTPException(status_code=404, detail="Vitals not found")
    
    return {"message": "Vitals deleted successfully"}

# Labs endpoints
@router.post("/cases/{case_id}/labs", response_model=LabsResponse)
async def create_labs(case_id: str, labs_data: LabsCreate):
    """Create lab results for a case"""
    # Try to find by _id first, then by case_id field
    case = None
    try:
        case = await case_crud.get_by_id(case_id)
    except Exception:
        case = None
    if not case:
        case = await case_crud.find_one({"case_id": case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Create labs data
    labs_dict = labs_data.model_dump()
    # Use the actual MongoDB _id for case_id reference
    labs_dict["case_id"] = case["_id"]
    
    labs_id = await labs_crud.create(labs_dict)
    created_labs = await labs_crud.get_by_id(labs_id)
    created_labs = serialize_datetime_fields(created_labs)
    
    return LabsResponse(**created_labs)

@router.post("/cases/{case_id}/labs/bulk", response_model=List[LabsResponse])
async def create_multiple_labs(case_id: str, labs_data: List[LabsCreate]):
    """Create multiple lab results for a case"""
    # Try to find by _id first, then by case_id field
    case = None
    try:
        case = await case_crud.get_by_id(case_id)
    except Exception:
        case = None
    if not case:
        case = await case_crud.find_one({"case_id": case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    created_labs_list = []
    for lab_item in labs_data:
        # Create each lab entry
        labs_dict = lab_item.model_dump()
        # Use the actual MongoDB _id for case_id reference
        labs_dict["case_id"] = case["_id"]
        
        labs_id = await labs_crud.create(labs_dict)
        created_labs = await labs_crud.get_by_id(labs_id)
        created_labs = serialize_datetime_fields(created_labs)
        created_labs_list.append(LabsResponse(**created_labs))
    
    return created_labs_list

@router.get("/cases/{case_id}/labs", response_model=List[LabsResponse])
async def get_case_labs(
    case_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    status: Optional[str] = None
):
    """Get all lab results for a case"""
    # Try to find by _id first, then by case_id field
    case = None
    try:
        case = await case_crud.get_by_id(case_id)
    except Exception:
        case = None
    if not case:
        case = await case_crud.find_one({"case_id": case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    filter_dict = {"case_id": case["_id"]}
    if status:
        filter_dict["status"] = status

    labs = await labs_crud.get_many(
        filter_dict=filter_dict,
        skip=skip,
        limit=limit,
        sort_by="date",
        sort_order=-1
    )
    return [LabsResponse(**serialize_datetime_fields(lab)) for lab in labs]

@router.get("/labs/{labs_id}", response_model=LabsResponse)
async def get_labs(labs_id: str):
    """Get lab results by ID"""
    labs = await labs_crud.get_by_id(labs_id)
    if not labs:
        raise HTTPException(status_code=404, detail="Lab results not found")
    
    labs = serialize_datetime_fields(labs)
    return LabsResponse(**labs)

@router.put("/labs/{labs_id}", response_model=LabsResponse)
async def update_labs(labs_id: str, labs_update: LabsUpdate):
    """Update lab results by ID"""
    # Check if labs exist
    existing_labs = await labs_crud.get_by_id(labs_id)
    if not existing_labs:
        raise HTTPException(status_code=404, detail="Lab results not found")
    
    # Update labs
    update_data = labs_update.model_dump(exclude_unset=True)
    success = await labs_crud.update(labs_id, update_data)
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update lab results")
    
    updated_labs = await labs_crud.get_by_id(labs_id)
    updated_labs = serialize_datetime_fields(updated_labs)
    return LabsResponse(**updated_labs)

@router.delete("/labs/{labs_id}")
async def delete_labs(labs_id: str):
    """Delete lab results by ID"""
    success = await labs_crud.delete(labs_id)
    if not success:
        raise HTTPException(status_code=404, detail="Lab results not found")
    
    return {"message": "Lab results deleted successfully"}