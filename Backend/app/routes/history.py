from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from app.models.history import (
    MedicalHistory, MedicalHistoryCreate, MedicalHistoryUpdate, MedicalHistoryResponse,
    SocialHistory, SocialHistoryCreate, SocialHistoryUpdate, SocialHistoryResponse
)
from app.db import medical_history_crud, social_history_crud, patient_crud
from bson import ObjectId
from datetime import datetime

router = APIRouter(tags=["patient-history"])

def serialize_datetime_fields(data: dict) -> dict:
    """Convert datetime objects to ISO format strings for history dicts"""
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

async def get_patient_by_id_or_mrn(patient_id: str):
    """Try to find patient by MongoDB _id or by MRN"""
    patient = None
    try:
        patient = await patient_crud.get_by_id(patient_id)
    except Exception:
        patient = None
    if not patient:
        patient = await patient_crud.find_one({"mrn": patient_id})
    return patient

# Medical History endpoints
@router.post("/patients/{patient_id}/medical-history", response_model=MedicalHistoryResponse)
async def create_medical_history(patient_id: str, history_data: MedicalHistoryCreate):
    """Create or update medical history for a patient"""
    # Check if patient exists
    patient = await get_patient_by_id_or_mrn(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    patient_obj_id = patient["_id"]

    # Check if medical history already exists
    existing_history = await medical_history_crud.find_one({"patient_id": patient_obj_id})
    if existing_history:
        raise HTTPException(status_code=400, detail="Medical history already exists. Use PUT to update.")

    # Create medical history data
    history_dict = history_data.model_dump()
    history_dict["patient_id"] = patient_obj_id

    history_id = await medical_history_crud.create(history_dict)
    created_history = await medical_history_crud.get_by_id(history_id)
    created_history = serialize_datetime_fields(created_history)

    return MedicalHistoryResponse(**created_history)

@router.get("/patients/{patient_id}/medical-history", response_model=MedicalHistoryResponse)
async def get_patient_medical_history(patient_id: str):
    """Get medical history for a patient"""
    patient = await get_patient_by_id_or_mrn(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    patient_obj_id = patient["_id"]

    history = await medical_history_crud.find_one({"patient_id": patient_obj_id})
    if not history:
        raise HTTPException(status_code=404, detail="Medical history not found")
    history = serialize_datetime_fields(history)
    return MedicalHistoryResponse(**history)

@router.put("/patients/{patient_id}/medical-history", response_model=MedicalHistoryResponse)
async def update_patient_medical_history(patient_id: str, history_update: MedicalHistoryUpdate):
    """Update medical history for a patient"""
    patient = await get_patient_by_id_or_mrn(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    patient_obj_id = patient["_id"]

    existing_history = await medical_history_crud.find_one({"patient_id": patient_obj_id})
    if not existing_history:
        raise HTTPException(status_code=404, detail="Medical history not found")

    update_data = history_update.model_dump(exclude_unset=True)
    success = await medical_history_crud.update(existing_history["_id"], update_data)

    if not success:
        raise HTTPException(status_code=400, detail="Failed to update medical history")

    updated_history = await medical_history_crud.get_by_id(existing_history["_id"])
    updated_history = serialize_datetime_fields(updated_history)
    return MedicalHistoryResponse(**updated_history)

@router.delete("/patients/{patient_id}/medical-history")
async def delete_patient_medical_history(patient_id: str):
    patient = await get_patient_by_id_or_mrn(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    patient_obj_id = patient["_id"]

    existing_history = await medical_history_crud.find_one({"patient_id": patient_obj_id})
    if not existing_history:
        raise HTTPException(status_code=404, detail="Medical history not found")

    success = await medical_history_crud.delete(existing_history["_id"])
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete medical history")

    return {"message": "Medical history deleted successfully"}

# Social History endpoints
@router.post("/patients/{patient_id}/social-history", response_model=SocialHistoryResponse)
async def create_social_history(patient_id: str, history_data: SocialHistoryCreate):
    """Create or update social history for a patient"""
    patient = await get_patient_by_id_or_mrn(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    patient_obj_id = patient["_id"]

    existing_history = await social_history_crud.find_one({"patient_id": patient_obj_id})
    if existing_history:
        raise HTTPException(status_code=400, detail="Social history already exists. Use PUT to update.")

    history_dict = history_data.model_dump()
    history_dict["patient_id"] = patient_obj_id

    history_id = await social_history_crud.create(history_dict)
    created_history = await social_history_crud.get_by_id(history_id)
    created_history = serialize_datetime_fields(created_history)

    return SocialHistoryResponse(**created_history)

@router.get("/patients/{patient_id}/social-history", response_model=SocialHistoryResponse)
async def get_patient_social_history(patient_id: str):
    patient = await get_patient_by_id_or_mrn(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    patient_obj_id = patient["_id"]

    history = await social_history_crud.find_one({"patient_id": patient_obj_id})
    if not history:
        raise HTTPException(status_code=404, detail="Social history not found")
    history = serialize_datetime_fields(history)
    return SocialHistoryResponse(**history)

@router.put("/patients/{patient_id}/social-history", response_model=SocialHistoryResponse)
async def update_patient_social_history(patient_id: str, history_update: SocialHistoryUpdate):
    patient = await get_patient_by_id_or_mrn(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    patient_obj_id = patient["_id"]

    existing_history = await social_history_crud.find_one({"patient_id": patient_obj_id})
    if not existing_history:
        raise HTTPException(status_code=404, detail="Social history not found")

    update_data = history_update.model_dump(exclude_unset=True)
    success = await social_history_crud.update(existing_history["_id"], update_data)

    if not success:
        raise HTTPException(status_code=400, detail="Failed to update social history")

    updated_history = await social_history_crud.get_by_id(existing_history["_id"])
    updated_history = serialize_datetime_fields(updated_history)
    return SocialHistoryResponse(**updated_history)

@router.delete("/patients/{patient_id}/social-history")
async def delete_patient_social_history(patient_id: str):
    patient = await get_patient_by_id_or_mrn(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    patient_obj_id = patient["_id"]

    existing_history = await social_history_crud.find_one({"patient_id": patient_obj_id})
    if not existing_history:
        raise HTTPException(status_code=404, detail="Social history not found")

    success = await social_history_crud.delete(existing_history["_id"])
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete social history")

    return {"message": "Social history deleted successfully"}