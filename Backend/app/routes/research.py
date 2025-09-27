from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from app.models.research import (
    ResearchSuggestions, ResearchSuggestionsResponse,
    ClinicalTrials, ClinicalTrialsResponse,
    Evidence, EvidenceResponse,
    Collaborations, CollaborationsResponse
)
from app.db import (
    research_suggestions_crud, clinical_trials_crud, evidence_crud,
    collaborations_crud, case_crud
)
from bson import ObjectId
from datetime import datetime

router = APIRouter(tags=["research-collaboration"])

def serialize_datetime_fields(data: dict) -> dict:
    """Convert datetime objects to ISO format strings for research dicts"""
    if not data:
        return data
    serialized = data.copy()
    for key, value in serialized.items():
        if isinstance(value, datetime):
            serialized[key] = value.isoformat()
    if "_id" in serialized and not isinstance(serialized["_id"], str):
        serialized["_id"] = str(serialized["_id"])
    if "case_id" in serialized and not isinstance(serialized.get("case_id"), str):
        serialized["case_id"] = str(serialized["case_id"])
    if "timestamp" in serialized and isinstance(serialized.get("timestamp"), datetime):
        serialized["timestamp"] = serialized["timestamp"].isoformat()
    return serialized

# Research Suggestions endpoints
@router.get("/research/suggestions", response_model=List[ResearchSuggestionsResponse])
async def get_research_suggestions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    category: Optional[str] = None,
    priority: Optional[str] = None
):
    filter_dict = {}
    if category:
        filter_dict["category"] = category
    if priority:
        filter_dict["priority"] = priority
    suggestions = await research_suggestions_crud.get_many(
        filter_dict=filter_dict,
        skip=skip,
        limit=limit,
        sort_by="confidence",
        sort_order=-1
    )
    return [ResearchSuggestionsResponse(**serialize_datetime_fields(suggestion)) for suggestion in suggestions]

@router.post("/research/suggestions")
async def create_research_suggestion(suggestion_data: dict):
    suggestion_data["timestamp"] = datetime.utcnow().isoformat()
    suggestion_id = await research_suggestions_crud.create(suggestion_data)
    created_suggestion = await research_suggestions_crud.get_by_id(suggestion_id)
    return ResearchSuggestionsResponse(**serialize_datetime_fields(created_suggestion))

# Clinical Trials endpoints
@router.get("/research/clinical-trials", response_model=List[ClinicalTrialsResponse])
async def get_clinical_trials(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    phase: Optional[str] = None,
    status: Optional[str] = None,
    location: Optional[str] = None
):
    filter_dict = {}
    if phase:
        filter_dict["phase"] = phase
    if status:
        filter_dict["status"] = status
    if location:
        filter_dict["location"] = {"$regex": location, "$options": "i"}
    trials = await clinical_trials_crud.get_many(
        filter_dict=filter_dict,
        skip=skip,
        limit=limit,
        sort_by="match_score",
        sort_order=-1
    )
    return [ClinicalTrialsResponse(**serialize_datetime_fields(trial)) for trial in trials]

@router.get("/research/clinical-trials/{trial_id}", response_model=ClinicalTrialsResponse)
async def get_clinical_trial(trial_id: str):
    trial = await clinical_trials_crud.get_by_id(trial_id)
    if not trial:
        raise HTTPException(status_code=404, detail="Clinical trial not found")
    return ClinicalTrialsResponse(**serialize_datetime_fields(trial))

@router.post("/research/clinical-trials")
async def create_clinical_trial(trial_data: dict):
    trial_data["timestamp"] = datetime.utcnow().isoformat()
    trial_id = await clinical_trials_crud.create(trial_data)
    created_trial = await clinical_trials_crud.get_by_id(trial_id)
    return ClinicalTrialsResponse(**serialize_datetime_fields(created_trial))

# Evidence endpoints
@router.get("/evidence/knowledge-graph", response_model=List[EvidenceResponse])
async def get_knowledge_graph_evidence(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    evidence_type: Optional[str] = None,
    min_quality_score: Optional[float] = None
):
    filter_dict = {}
    if evidence_type:
        filter_dict["evidence_type"] = evidence_type
    if min_quality_score is not None:
        filter_dict["quality_score"] = {"$gte": min_quality_score}
    evidence = await evidence_crud.get_many(
        filter_dict=filter_dict,
        skip=skip,
        limit=limit,
        sort_by="relevance_score",
        sort_order=-1
    )
    return [EvidenceResponse(**serialize_datetime_fields(ev)) for ev in evidence]

@router.get("/evidence/literature", response_model=List[EvidenceResponse])
async def get_literature_evidence(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    search: Optional[str] = None,
    year_from: Optional[int] = None,
    year_to: Optional[int] = None
):
    filter_dict = {}
    if search:
        filter_dict["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"authors": {"$regex": search, "$options": "i"}},
            {"journal": {"$regex": search, "$options": "i"}},
            {"key_findings": {"$regex": search, "$options": "i"}}
        ]
    if year_from or year_to:
        year_filter = {}
        if year_from:
            year_filter["$gte"] = year_from
        if year_to:
            year_filter["$lte"] = year_to
        filter_dict["year"] = year_filter
    evidence = await evidence_crud.get_many(
        filter_dict=filter_dict,
        skip=skip,
        limit=limit,
        sort_by="citation_count",
        sort_order=-1
    )
    return [EvidenceResponse(**serialize_datetime_fields(ev)) for ev in evidence]

@router.get("/evidence/timeline")
async def get_evidence_timeline():
    evidence = await evidence_crud.get_many(limit=1000, sort_by="year", sort_order=1)
    timeline = {}
    for ev in evidence:
        year = ev.get("year", 2023)
        if year not in timeline:
            timeline[year] = {"count": 0, "avg_quality": 0, "evidence": []}
        timeline[year]["count"] += 1
        timeline[year]["evidence"].append(ev.get("title", ""))
    return timeline

@router.post("/evidence")
async def create_evidence(evidence_data: dict):
    evidence_data["timestamp"] = datetime.utcnow().isoformat()
    evidence_id = await evidence_crud.create(evidence_data)
    created_evidence = await evidence_crud.get_by_id(evidence_id)
    return EvidenceResponse(**serialize_datetime_fields(created_evidence))

# Collaboration endpoints
@router.get("/collaborations", response_model=List[CollaborationsResponse])
async def get_collaborations(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    case_id: Optional[str] = None
):
    filter_dict = {}
    if case_id:
        filter_dict["case_id"] = case_id
    collaborations = await collaborations_crud.get_many(
        filter_dict=filter_dict,
        skip=skip,
        limit=limit,
        sort_by="_id",
        sort_order=-1
    )
    return [CollaborationsResponse(**serialize_datetime_fields(collab)) for collab in collaborations]

@router.get("/collaborations/{collab_id}", response_model=CollaborationsResponse)
async def get_collaboration(collab_id: str):
    collaboration = await collaborations_crud.get_by_id(collab_id)
    if not collaboration:
        raise HTTPException(status_code=404, detail="Collaboration not found")
    return CollaborationsResponse(**serialize_datetime_fields(collaboration))

@router.post("/collaborations/{collab_id}/messages")
async def add_collaboration_message(collab_id: str, message_data: dict):
    collaboration = await collaborations_crud.get_by_id(collab_id)
    if not collaboration:
        raise HTTPException(status_code=404, detail="Collaboration not found")
    message_data["timestamp"] = datetime.utcnow().isoformat()
    chat_messages = collaboration.get("chat_messages", [])
    chat_messages.append(message_data)
    success = await collaborations_crud.update(collab_id, {"chat_messages": chat_messages})
    if not success:
        raise HTTPException(status_code=400, detail="Failed to add message")
    return {"message": "Message added successfully", "message_data": message_data}

@router.post("/collaborations/{collab_id}/pin")
async def pin_collaboration_item(collab_id: str, pin_data: dict):
    collaboration = await collaborations_crud.get_by_id(collab_id)
    if not collaboration:
        raise HTTPException(status_code=404, detail="Collaboration not found")
    pin_data["timestamp"] = datetime.utcnow().isoformat()
    pinned_items = collaboration.get("pinned_items", [])
    pinned_items.append(pin_data)
    success = await collaborations_crud.update(collab_id, {"pinned_items": pinned_items})
    if not success:
        raise HTTPException(status_code=400, detail="Failed to pin item")
    return {"message": "Item pinned successfully", "pinned_item": pin_data}

@router.post("/collaborations")
async def create_collaboration(collaboration_data: dict):
    case_id = collaboration_data.get("case_id")
    if case_id:
        case = await case_crud.find_one({"case_id": case_id})
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
    collaboration_data["timestamp"] = datetime.utcnow().isoformat()
    collab_id = await collaborations_crud.create(collaboration_data)
    created_collab = await collaborations_crud.get_by_id(collab_id)
    return CollaborationsResponse(**serialize_datetime_fields(created_collab))