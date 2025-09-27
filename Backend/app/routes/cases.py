from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from app.models.case import Case, CaseCreate, CaseUpdate, CaseResponse
from app.db import case_crud, patient_crud
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/cases", tags=["cases"])

def serialize_datetime_fields(data: dict) -> dict:
    """Convert datetime objects to ISO format strings for case dicts"""
    if not data:
        return data
    serialized = data.copy()
    for key, value in serialized.items():
        if isinstance(value, datetime):
            serialized[key] = value.isoformat()
    if "_id" in serialized and not isinstance(serialized["_id"], str):
        serialized["_id"] = str(serialized["_id"])
    if "patient_id" in serialized and not isinstance(serialized["patient_id"], str):
        serialized["patient_id"] = str(serialized["patient_id"])
    return serialized

@router.post("/", response_model=CaseResponse)
async def create_case(case_data: CaseCreate):
    """Create a new case"""
    
    # Check if patient exists
    patient = await patient_crud.get_by_id(case_data.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check if case_id already exists
    existing_case = await case_crud.find_one({"case_id": case_data.case_id})
    if existing_case:
        raise HTTPException(status_code=400, detail="Case ID already exists")
    
    # Create case data
    case_dict = case_data.model_dump()
    # Remove unwanted fields if present
    case_dict.pop("urgency", None)
    case_dict.pop("confidence", None)
    case_dict.pop("top_dx", None)
    # Convert patient_id string to ObjectId
    case_dict["patient_id"] = ObjectId(case_data.patient_id)
    case_dict["last_update"] = datetime.utcnow()
    # Set diagnosed to False if not provided
    if "diagnosed" not in case_dict:
        case_dict["diagnosed"] = False
    case_id = await case_crud.create(case_dict)
    created_case = await case_crud.get_by_id(case_id)
    created_case = serialize_datetime_fields(created_case)
    return CaseResponse(**created_case)

@router.get("/", response_model=List[CaseResponse])
async def get_cases(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    status: Optional[str] = None,
    urgency: Optional[str] = None,
    patient_id: Optional[str] = None
):
    """Get all cases with optional filtering"""
    filter_dict = {}
    
    if status:
        filter_dict["status"] = status
    if patient_id:
        filter_dict["patient_id"] = ObjectId(patient_id)
    
    cases = await case_crud.get_many(
        filter_dict=filter_dict,
        skip=skip,
        limit=limit,
        sort_by="last_update",
        sort_order=-1
    )
    
    return [CaseResponse(**serialize_datetime_fields(case)) for case in cases]

@router.get("/undiagnosed", response_model=List[dict])
async def get_undiagnosed_patients(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100)
):
    """Get all undiagnosed patients with basic info"""
    # Find all cases where diagnosed = false
    undiagnosed_cases = await case_crud.get_many(
        filter_dict={"diagnosed": False},
        skip=skip,
        limit=limit,
        sort_by="last_update",
        sort_order=-1
    )
    
    result = []
    for case in undiagnosed_cases:
        # Get patient info for each case
        patient_id = case.get("patient_id")
        if patient_id:
            patient = await patient_crud.get_by_id(str(patient_id))
            if patient:
                result.append({
                    "patient_name": patient.get("name"),
                    "patient_mrn": patient.get("mrn"),
                    "patient_age": patient.get("age"),
                    "case_id": case.get("case_id"),
                    "patient_id": str(patient_id)
                })
    
    return result

@router.get("/diagnosed", response_model=List[dict])
async def get_diagnosed_patients(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100)
):
    """Get all diagnosed patients with diagnosis info"""
    # Find all cases where diagnosed = true
    diagnosed_cases = await case_crud.get_many(
        filter_dict={"diagnosed": True},
        skip=skip,
        limit=limit,
        sort_by="last_update",
        sort_order=-1
    )
    
    result = []
    for case in diagnosed_cases:
        # Get patient info for each case
        patient_id = case.get("patient_id")
        if patient_id:
            patient = await patient_crud.get_by_id(str(patient_id))
            if patient:
                result.append({
                    "patient_name": patient.get("name"),
                    "patient_age": patient.get("age"),
                    "patient_mrn": patient.get("mrn"),
                    "current_diagnosis": case.get("current_dx"),
                    "status": case.get("status")
                })
    
    return result

@router.get("/{case_id}", response_model=CaseResponse)
async def get_case(case_id: str):
    """Get case by ID"""
    case = await case_crud.get_by_id(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    case = serialize_datetime_fields(case)
    return CaseResponse(**case)

@router.get("/case-number/{case_number}", response_model=CaseResponse)
async def get_case_by_case_number(case_number: str):
    """Get case by case_id (case number)"""
    case = await case_crud.find_one({"case_id": case_number})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    case = serialize_datetime_fields(case)
    return CaseResponse(**case)

@router.put("/{case_id}", response_model=CaseResponse)
async def update_case(case_id: str, case_update: CaseUpdate):
    """Update case by ID"""
    # Check if case exists
    existing_case = await case_crud.get_by_id(case_id)
    if not existing_case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Update case
    update_data = case_update.model_dump(exclude_unset=True)
    # Remove unwanted fields if present
    update_data.pop("urgency", None)
    update_data.pop("confidence", None)
    update_data.pop("top_dx", None)
    update_data["last_update"] = datetime.utcnow()
    success = await case_crud.update(case_id, update_data)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update case")
    updated_case = await case_crud.get_by_id(case_id)
    updated_case = serialize_datetime_fields(updated_case)
    return CaseResponse(**updated_case)

@router.delete("/{case_id}")
async def delete_case(case_id: str):
    """Delete case by ID"""
    success = await case_crud.delete(case_id)
    if not success:
        raise HTTPException(status_code=404, detail="Case not found")
    
    return {"message": "Case deleted successfully"}

@router.get("/{case_id}/summary")
async def get_case_summary(case_id: str):
    """Get case summary with related data counts"""
    from bson import ObjectId
    from app.db import vitals_crud, labs_crud, orders_crud

    # Try to find by _id first, then by case_id field
    case = None
    try:
        case = await case_crud.get_by_id(case_id)
    except Exception:
        pass
    if not case:
        case = await case_crud.find_one({"case_id": case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    case = serialize_datetime_fields(case)

    # Get related data counts
    case_obj_id = case.get("_id")
    if case_obj_id and not isinstance(case_obj_id, ObjectId):
        try:
            case_obj_id = ObjectId(case_obj_id)
        except Exception:
            case_obj_id = None

    vitals_count = await vitals_crud.count({"case_id": case_obj_id}) if case_obj_id else 0
    labs_count = await labs_crud.count({"case_id": case_obj_id}) if case_obj_id else 0
    orders_count = await orders_crud.count({"case_id": case_obj_id}) if case_obj_id else 0

    # Get patient info
    patient_id = case.get("patient_id")
    if patient_id and not isinstance(patient_id, str):
        patient_id = str(patient_id)
    patient = await patient_crud.get_by_id(patient_id) if patient_id else None

    return {
        "case": CaseResponse(**case),
        "patient": patient,
        "vitals_count": vitals_count,
        "labs_count": labs_count,
        "orders_count": orders_count
    }

@router.get("/patient/{patient_id}/cases", response_model=List[CaseResponse])
async def get_patient_cases(patient_id: str):
    """Get all cases for a specific patient"""
    # Check if patient exists
    patient = await patient_crud.get_by_id(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    cases = await case_crud.find_by_field("patient_id", ObjectId(patient_id))
    return [CaseResponse(**serialize_datetime_fields(case)) for case in cases]