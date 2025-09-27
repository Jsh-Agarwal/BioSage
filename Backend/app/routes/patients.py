from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from app.models.patient import Patient, PatientCreate, PatientUpdate, PatientResponse
from app.db import patient_crud
from datetime import datetime

router = APIRouter(prefix="/patients", tags=["patients"])

def serialize_datetime_fields(data: dict) -> dict:
    """Convert datetime objects to ISO format strings for patient dicts"""
    if not data:
        return data
    
    serialized = data.copy()
    for key, value in serialized.items():
        if isinstance(value, datetime):
            serialized[key] = value.isoformat()
    if "_id" in serialized and not isinstance(serialized["_id"], str):
        serialized["_id"] = str(serialized["_id"])
    return serialized

@router.post("/", response_model=PatientResponse)
async def create_patient(patient_data: PatientCreate):
    """Create a new patient"""
    
    # Check if patient with MRN already exists
    existing_patient = await patient_crud.find_one({"mrn": patient_data.mrn})
    if existing_patient:
        raise HTTPException(status_code=400, detail="Patient with this MRN already exists")
    
    # Create patient data
    patient_dict = patient_data.model_dump()
    patient_dict["created_at"] = datetime.utcnow()
    
    patient_id = await patient_crud.create(patient_dict)
    created_patient = await patient_crud.get_by_id(patient_id)
    
    # Serialize datetime fields
    created_patient = serialize_datetime_fields(created_patient)
    
    return PatientResponse(**created_patient)

@router.get("/", response_model=List[PatientResponse])
async def get_patients(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    search: Optional[str] = None,
    gender: Optional[str] = None
):
    """Get all patients with optional search and filtering"""
    filter_dict = {}
    
    if gender:
        filter_dict["gender"] = gender
    
    if search:
        # Simple search across name, MRN, email
        filter_dict["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"mrn": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    
    patients = await patient_crud.get_many(
        filter_dict=filter_dict,
        skip=skip,
        limit=limit,
        sort_by="created_at",
        sort_order=-1
    )
    
    # Serialize datetime fields for each patient
    serialized_patients = [serialize_datetime_fields(patient) for patient in patients]
    return [PatientResponse(**patient) for patient in serialized_patients]

@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(patient_id: str):
    """Get patient by ID"""
    patient = await patient_crud.get_by_id(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Serialize datetime fields
    patient = serialize_datetime_fields(patient)
    return PatientResponse(**patient)

@router.get("/mrn/{mrn}", response_model=PatientResponse)
async def get_patient_by_mrn(mrn: str):
    """Get patient by MRN"""
    patient = await patient_crud.find_one({"mrn": mrn})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Serialize datetime fields
    patient = serialize_datetime_fields(patient)
    return PatientResponse(**patient)

@router.put("/{patient_id}", response_model=PatientResponse)
async def update_patient(patient_id: str, patient_update: PatientUpdate):
    """Update patient by ID"""
    # Check if patient exists
    existing_patient = await patient_crud.get_by_id(patient_id)
    if not existing_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check MRN uniqueness if MRN is being updated
    if patient_update.mrn:
        mrn_exists = await patient_crud.find_one({"mrn": patient_update.mrn, "_id": {"$ne": patient_id}})
        if mrn_exists:
            raise HTTPException(status_code=400, detail="MRN already exists")
    
    # Update patient
    update_data = patient_update.model_dump(exclude_unset=True)
    success = await patient_crud.update(patient_id, update_data)
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update patient")
    
    updated_patient = await patient_crud.get_by_id(patient_id)
    updated_patient = serialize_datetime_fields(updated_patient)
    return PatientResponse(**updated_patient)

@router.delete("/{patient_id}")
async def delete_patient(patient_id: str):
    """Delete patient by ID"""
    success = await patient_crud.delete(patient_id)
    if not success:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    return {"message": "Patient deleted successfully"}

@router.get("/{patient_id}/summary")
async def get_patient_summary(patient_id: str):
    """Get patient summary with basic info and stats"""
    patient = await patient_crud.get_by_id(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    patient = serialize_datetime_fields(patient)
    # TODO: Replace with actual count from cases collection if available
    cases_count = 0
    return {
        "patient": PatientResponse(**patient),
        "total_cases": cases_count,
        "last_updated": patient.get("created_at")
    }