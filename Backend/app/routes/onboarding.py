from fastapi import APIRouter, HTTPException
from app.db import (
    patient_crud, case_crud, vitals_crud, labs_crud,
    medical_history_crud, social_history_crud
)
from bson import ObjectId
from datetime import datetime

# ADDED: typing + deep serializer helpers
from typing import Any, Dict, List, Union

def _serialize_any(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, dict):
        return {k: _serialize_any(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_serialize_any(v) for v in value]
    return value
# /ADDED

router = APIRouter(prefix="/onboarding", tags=["onboarding"])

def serialize_datetime_fields(data: dict) -> dict:
    if not data:
        return data
    serialized = data.copy()
    for key, value in serialized.items():
        if isinstance(value, datetime):
            serialized[key] = value.isoformat()
    if "_id" in serialized and not isinstance(serialized["_id"], str):
        serialized["_id"] = str(serialized["_id"])
    if "patient_id" in serialized and not isinstance(serialized.get("patient_id"), str):
        serialized["patient_id"] = str(serialized["patient_id"])
    return serialized

def _object_id_or_none(value: str):
    try:
        return ObjectId(value) if ObjectId.is_valid(value) else None
    except Exception:
        return None

def _dual_patient_filters(patient_id: str):
    """Return list of possible filter forms for backward compatibility."""
    oid = _object_id_or_none(patient_id)
    filters = [{"patient_id": patient_id}]
    if oid:
        filters.append({"patient_id": oid})
    return filters

def _dual_case_filters(case_id: str):
    oid = _object_id_or_none(case_id)
    filters = [{"case_id": case_id}]
    if oid:
        filters.append({"case_id": oid})
    return filters

# ADDED: small utility for safe string id
def _as_str_id(v: Any) -> str:
    return v if isinstance(v, str) else str(v)
# /ADDED

@router.post("/")
async def create_onboarding(payload: dict):
    """Create patient onboarding (all records)"""
    # Patient
    patient_data = payload.get("patient")
    if not patient_data:
        raise HTTPException(status_code=400, detail="Missing patient data")
    patient_data["created_at"] = datetime.utcnow()
    patient_id = await patient_crud.create(patient_data)
    patient = await patient_crud.get_by_id(patient_id)

    # Case (store patient_id as string consistently)
    case_data = payload.get("case")
    if case_data:
        case_data["patient_id"] = patient_id  # keep string
        case_data["last_update"] = datetime.utcnow()
        # Remove unwanted fields if present
        case_data.pop("urgency", None)
        case_data.pop("confidence", None)
        case_data.pop("top_dx", None)
        # Set diagnosed to False by default
        case_data["diagnosed"] = False
        case_id = await case_crud.create(case_data)
        case = await case_crud.get_by_id(case_id)
    else:
        case = None

    # Vitals
    vitals_data = payload.get("vitals")
    if vitals_data and case:
        vitals_data["case_id"] = case["_id"]  # keep string
        vitals_data["timestamp"] = datetime.utcnow()
        vitals_id = await vitals_crud.create(vitals_data)
        vitals = await vitals_crud.get_by_id(vitals_id)
    else:
        vitals = None

    # Labs - Handle as array
    labs_data = payload.get("labs")
    labs = None
    if labs_data and case:
        if isinstance(labs_data, list):
            # If labs_data is a list, create all lab entries
            labs = []
            for lab_item in labs_data:
                if isinstance(lab_item, dict):
                    lab_item["case_id"] = case["_id"]
                    labs_id = await labs_crud.create(lab_item)
                    lab = await labs_crud.get_by_id(labs_id)
                    labs.append(serialize_datetime_fields(lab))
        elif isinstance(labs_data, dict):
            # Single lab entry - make it an array for consistency
            labs_data["case_id"] = case["_id"]
            labs_id = await labs_crud.create(labs_data)
            lab = await labs_crud.get_by_id(labs_id)
            labs = [serialize_datetime_fields(lab)]

    # Medical History
    med_history_data = payload.get("medical_history")
    if med_history_data:
        med_history_data["patient_id"] = patient_id
        med_history_id = await medical_history_crud.create(med_history_data)
        medical_history = await medical_history_crud.get_by_id(med_history_id)
    else:
        medical_history = None

    # Social History
    social_history_data = payload.get("social_history")
    if social_history_data:
        social_history_data["patient_id"] = patient_id
        social_history_id = await social_history_crud.create(social_history_data)
        social_history = await social_history_crud.get_by_id(social_history_id)
    else:
        social_history = None

    # ADDED: include labs_list if we created multiple
    return {
        "patient": serialize_datetime_fields(patient),
        "case": serialize_datetime_fields(case),
        "vitals": serialize_datetime_fields(vitals),
        "labs": labs,  # Now labs is already an array and serialized
        "medical_history": serialize_datetime_fields(medical_history),
        "social_history": serialize_datetime_fields(social_history)
    }

@router.get("/{patient_id}")
async def get_onboarding(patient_id: str):
    """Get all onboarding records for a patient"""
    # Patient
    patient = await patient_crud.get_by_id(patient_id)
    if not patient:
        # attempt by MRN fallback
        patient = await patient_crud.find_one({"mrn": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Case: try both stored as string patient_id or ObjectId
    case = None
    for f in _dual_patient_filters(patient["_id"]):
        case = await case_crud.find_one(f)
        if case:
            break

    # Vitals (latest single) if case found
    vitals = None
    if case:
        vitals = await vitals_crud.find_one({"case_id": case["_id"]})

    # Labs - Get all labs for the case as an array
    labs = None
    if case:
        try:
            # Try to get all labs for the case
            labs_list = await labs_crud.get_many({"case_id": case["_id"]})
            if labs_list:
                labs = [serialize_datetime_fields(lab) for lab in labs_list]
        except Exception:
            # Fallback to single lab
            single_lab = await labs_crud.find_one({"case_id": case["_id"]})
            if single_lab:
                labs = [serialize_datetime_fields(single_lab)]

    # Medical history
    medical_history = None
    for f in _dual_patient_filters(patient["_id"]):
        medical_history = await medical_history_crud.find_one(f)
        if medical_history:
            break

    # Social history
    social_history = None
    for f in _dual_patient_filters(patient["_id"]):
        social_history = await social_history_crud.find_one(f)
        if social_history:
            break

    # ADDED: include labs_list if available
    return {
        "patient": serialize_datetime_fields(patient),
        "case": serialize_datetime_fields(case),
        "vitals": serialize_datetime_fields(vitals),
        "labs": labs,  # Now labs is already an array and serialized
        "medical_history": serialize_datetime_fields(medical_history),
        "social_history": serialize_datetime_fields(social_history)
    }

@router.put("/{patient_id}")
async def update_onboarding(patient_id: str, payload: dict):
    """Update all onboarding records for a patient"""

    patient = await patient_crud.get_by_id(patient_id)
    if not patient:
        patient = await patient_crud.find_one({"mrn": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Patient
    patient_data = payload.get("patient")
    if patient_data:
        await patient_crud.update(patient["_id"], patient_data)
        patient = await patient_crud.get_by_id(patient["_id"])

    # Case
    case = None
    for f in _dual_patient_filters(patient["_id"]):
        case = await case_crud.find_one(f)
        if case:
            break
    case_data = payload.get("case")
    if case and case_data:
        case_data["last_update"] = datetime.utcnow()
        await case_crud.update(case["_id"], case_data)
        case = await case_crud.get_by_id(case["_id"])

    # ADDED: create case if missing but client sent case data
    if not case and case_data:
        case_to_create = case_data.copy()
        case_to_create["patient_id"] = _as_str_id(patient["_id"])
        case_to_create["last_update"] = datetime.utcnow()
        new_case_id = await case_crud.create(case_to_create)
        case = await case_crud.get_by_id(new_case_id)
    # /ADDED

    # Vitals
    vitals = None
    if case:
        vitals = await vitals_crud.find_one({"case_id": case["_id"]})
    vitals_data = payload.get("vitals")
    if vitals and vitals_data:
        await vitals_crud.update(vitals["_id"], vitals_data)
        vitals = await vitals_crud.get_by_id(vitals["_id"])

    # ADDED: create vitals if none exist but client provided vitals
    if case and not vitals and vitals_data:
        vitals_to_create = vitals_data.copy()
        vitals_to_create["case_id"] = case["_id"]
        vitals_to_create["timestamp"] = datetime.utcnow()
        v_id = await vitals_crud.create(vitals_to_create)
        vitals = await vitals_crud.get_by_id(v_id)
    # /ADDED

    # Labs - Handle as array
    labs = None
    if case:
        # Get all existing labs for the case
        existing_labs = await labs_crud.get_many({"case_id": case["_id"]})
        if existing_labs:
            labs = [serialize_datetime_fields(lab) for lab in existing_labs]
    
    labs_data = payload.get("labs")
    if case and labs_data:
        if isinstance(labs_data, list):
            # Delete existing labs and create new ones
            if labs:
                for lab in existing_labs:
                    await labs_crud.delete(lab["_id"])
            
            # Create new labs from array
            labs = []
            for lab_item in labs_data:
                if isinstance(lab_item, dict):
                    lab_to_create = lab_item.copy()
                    lab_to_create["case_id"] = case["_id"]
                    lab_id = await labs_crud.create(lab_to_create)
                    lab = await labs_crud.get_by_id(lab_id)
                    labs.append(serialize_datetime_fields(lab))
        elif isinstance(labs_data, dict):
            # Single lab entry - update first one or create new
            if existing_labs:
                await labs_crud.update(existing_labs[0]["_id"], labs_data)
                updated_lab = await labs_crud.get_by_id(existing_labs[0]["_id"])
                labs = [serialize_datetime_fields(updated_lab)]
            else:
                lab_to_create = labs_data.copy()
                lab_to_create["case_id"] = case["_id"]
                lab_id = await labs_crud.create(lab_to_create)
                lab = await labs_crud.get_by_id(lab_id)
                labs = [serialize_datetime_fields(lab)]

    # Medical History
    medical_history = None
    for f in _dual_patient_filters(patient["_id"]):
        medical_history = await medical_history_crud.find_one(f)
        if medical_history:
            break
    med_history_data = payload.get("medical_history")
    if medical_history and med_history_data:
        await medical_history_crud.update(medical_history["_id"], med_history_data)
        medical_history = await medical_history_crud.get_by_id(medical_history["_id"])

    # ADDED: create medical history if missing
    if not medical_history and med_history_data:
        mh_to_create = med_history_data.copy()
        mh_to_create["patient_id"] = _as_str_id(patient["_id"])
        mh_id = await medical_history_crud.create(mh_to_create)
        medical_history = await medical_history_crud.get_by_id(mh_id)
    # /ADDED

    # Social History
    social_history = None
    for f in _dual_patient_filters(patient["_id"]):
        social_history = await social_history_crud.find_one(f)
        if social_history:
            break
    social_history_data = payload.get("social_history")
    if social_history and social_history_data:
        await social_history_crud.update(social_history["_id"], social_history_data)
        social_history = await social_history_crud.get_by_id(social_history["_id"])

    # ADDED: create social history if missing
    if not social_history and social_history_data:
        sh_to_create = social_history_data.copy()
        sh_to_create["patient_id"] = _as_str_id(patient["_id"])
        sh_id = await social_history_crud.create(sh_to_create)
        social_history = await social_history_crud.get_by_id(sh_id)
    # /ADDED

    return {
        "patient": serialize_datetime_fields(patient),
        "case": serialize_datetime_fields(case),
        "vitals": serialize_datetime_fields(vitals),
        "labs": labs,  # Now labs is already an array and serialized
        "medical_history": serialize_datetime_fields(medical_history),
        "social_history": serialize_datetime_fields(social_history)
    }

@router.delete("/{patient_id}")
async def delete_onboarding(patient_id: str):
    """Delete all onboarding records for a patient"""
    patient = await patient_crud.get_by_id(patient_id)
    if not patient:
        patient = await patient_crud.find_one({"mrn": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Case & related
    case = None
    for f in _dual_patient_filters(patient["_id"]):
        case = await case_crud.find_one(f)
        if case:
            break
    if case:
        vitals = await vitals_crud.find_one({"case_id": case["_id"]})
        if vitals:
            await vitals_crud.delete(vitals["_id"])
        labs = await labs_crud.find_one({"case_id": case["_id"]})
        if labs:
            await labs_crud.delete(labs["_id"])
        # ADDED: in case there are multiple vitals/labs, purge them all
        # purge remaining vitals
        while True:
            more_v = await vitals_crud.find_one({"case_id": case["_id"]})
            if not more_v:
                break
            await vitals_crud.delete(more_v["_id"])
        # purge remaining labs
        while True:
            more_l = await labs_crud.find_one({"case_id": case["_id"]})
            if not more_l:
                break
            await labs_crud.delete(more_l["_id"])
        # /ADDED
        await case_crud.delete(case["_id"])

    # Medical History
    mh = None
    for f in _dual_patient_filters(patient["_id"]):
        mh = await medical_history_crud.find_one(f)
        if mh:
            await medical_history_crud.delete(mh["_id"])
            break

    # Social History
    sh = None
    for f in _dual_patient_filters(patient["_id"]):
        sh = await social_history_crud.find_one(f)
        if sh:
            await social_history_crud.delete(sh["_id"])
            break

    await patient_crud.delete(patient["_id"])
    return {"message": "Patient and all related records deleted successfully"}