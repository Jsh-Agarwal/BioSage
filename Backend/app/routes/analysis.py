from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from app.models.core import (
    Agents, AgentStatus, RecentCase,
    AuditLogs, AuditSeverity,
    SystemEvents, SystemEventStatus,
    SpecialistResults, SpecialistResultStatus,
    IntegratedResults,
    Feedback, FeedbackPriority
)
from app.db import (
    agents_crud, audit_logs_crud, system_events_crud,
    specialist_results_crud, integrated_results_crud, feedback_crud,
    case_crud
)
from datetime import datetime
from bson import ObjectId

router = APIRouter(tags=["system-analysis"])

def serialize_datetime_fields(data: dict) -> dict:
    """Convert datetime objects to ISO format strings for analysis dicts"""
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

async def get_case_by_id_or_caseid(case_id: str):
    case = None
    try:
        case = await case_crud.get_by_id(case_id)
    except Exception:
        case = None
    if not case:
        case = await case_crud.find_one({"case_id": case_id})
    return case

# Agents endpoints
@router.get("/agents")
async def get_agents(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    status: Optional[str] = None
):
    """Get all agents"""
    filter_dict = {}
    if status:
        filter_dict["status"] = status
    
    agents = await agents_crud.get_many(
        filter_dict=filter_dict,
        skip=skip,
        limit=limit,
        sort_by="confidence",
        sort_order=-1
    )
    
    return [serialize_datetime_fields(agent) for agent in agents]

@router.get("/agents/{agent_id}")
async def get_agent(agent_id: str):
    """Get agent by ID"""
    agent = await agents_crud.get_by_id(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    return serialize_datetime_fields(agent)

@router.get("/agents/{agent_id}/recent-cases")
async def get_agent_recent_cases(agent_id: str):
    """Get recent cases for an agent"""
    agent = await agents_crud.get_by_id(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    return agent.get("recent_cases", [])

@router.get("/agents/status")
async def get_agents_status():
    """Get agents status summary"""
    total_agents = await agents_crud.count()
    online_agents = await agents_crud.count({"status": "online"})
    offline_agents = await agents_crud.count({"status": "offline"})
    
    return {
        "total_agents": total_agents,
        "online_agents": online_agents,
        "offline_agents": offline_agents,
        "availability_rate": online_agents / total_agents if total_agents > 0 else 0
    }

# Specialist Results endpoints
@router.get("/cases/{case_id}/specialist-results")
async def get_case_specialist_results(case_id: str):
    """Get specialist results for a case"""
    case = await get_case_by_id_or_caseid(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    results = await specialist_results_crud.find_by_field("case_id", case["_id"])
    return [serialize_datetime_fields(r) for r in results]

@router.post("/cases/{case_id}/specialist-results")
async def create_specialist_result(case_id: str, result_data: dict):
    """Create specialist result for a case"""
    case = await get_case_by_id_or_caseid(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    result_dict = result_data.copy()
    result_dict["case_id"] = case["_id"]
    result_dict["timestamp"] = datetime.utcnow().isoformat()
    result_id = await specialist_results_crud.create(result_dict)
    created_result = await specialist_results_crud.get_by_id(result_id)
    return serialize_datetime_fields(created_result)

# Integrated Results endpoints
@router.get("/cases/{case_id}/integrated-results")
async def get_case_integrated_results(
    case_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100)
):
    """Get integrated results for a case"""
    case = await get_case_by_id_or_caseid(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    results = await integrated_results_crud.get_many(
        filter_dict={"case_id": case["_id"]},
        skip=skip,
        limit=limit,
        sort_by="rank",
        sort_order=1
    )
    return [serialize_datetime_fields(r) for r in results]

@router.post("/cases/{case_id}/integrated-results")
async def create_integrated_result(case_id: str, result_data: dict):
    """Create integrated result for a case"""
    case = await get_case_by_id_or_caseid(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    result_dict = result_data.copy()
    result_dict["case_id"] = case["_id"]
    result_dict["timestamp"] = datetime.utcnow().isoformat()
    result_id = await integrated_results_crud.create(result_dict)
    created_result = await integrated_results_crud.get_by_id(result_id)
    return serialize_datetime_fields(created_result)

# Feedback endpoints
@router.get("/feedback")
async def get_feedback(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    processed: Optional[bool] = None,
    priority: Optional[str] = None
):
    """Get all feedback"""
    filter_dict = {}
    
    if processed is not None:
        filter_dict["processed"] = processed
    if priority:
        filter_dict["priority"] = priority
    
    feedback_list = await feedback_crud.get_many(
        filter_dict=filter_dict,
        skip=skip,
        limit=limit,
        sort_by="timestamp",
        sort_order=-1
    )
    
    return [serialize_datetime_fields(f) for f in feedback_list]

@router.post("/feedback")
async def create_feedback(feedback_data: dict):
    """Create new feedback"""
    feedback_dict = feedback_data.copy()
    feedback_dict["timestamp"] = datetime.utcnow().isoformat()
    
    feedback_id = await feedback_crud.create(feedback_dict)
    created_feedback = await feedback_crud.get_by_id(feedback_id)
    
    return serialize_datetime_fields(created_feedback)

# Audit Logs endpoints
@router.get("/audit-logs")
async def get_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    user_id: Optional[str] = None,
    action: Optional[str] = None,
    severity: Optional[str] = None
):
    """Get audit logs"""
    filter_dict = {}
    
    if user_id:
        filter_dict["user_id"] = user_id
    if action:
        filter_dict["action"] = action
    if severity:
        filter_dict["severity"] = severity
    
    logs = await audit_logs_crud.get_many(
        filter_dict=filter_dict,
        skip=skip,
        limit=limit,
        sort_by="timestamp",
        sort_order=-1
    )
    
    return [serialize_datetime_fields(log) for log in logs]

@router.get("/audit-logs/{log_id}")
async def get_audit_log(log_id: str):
    """Get audit log by ID"""
    log = await audit_logs_crud.get_by_id(log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Audit log not found")
    
    return serialize_datetime_fields(log)

# System Events endpoints
@router.get("/system-events")
async def get_system_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    status: Optional[str] = None,
    event: Optional[str] = None
):
    """Get system events"""
    filter_dict = {}
    
    if status:
        filter_dict["status"] = status
    if event:
        filter_dict["event"] = event
    
    events = await system_events_crud.get_many(
        filter_dict=filter_dict,
        skip=skip,
        limit=limit,
        sort_by="timestamp",
        sort_order=-1
    )
    
    return [serialize_datetime_fields(e) for e in events]

@router.get("/system-events/{event_id}")
async def get_system_event(event_id: str):
    """Get system event by ID"""
    event = await system_events_crud.get_by_id(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="System event not found")
    
    return serialize_datetime_fields(event)

@router.post("/system-events")
async def create_system_event(event_data: dict):
    """Create system event"""
    event_dict = event_data.copy()
    event_dict["timestamp"] = datetime.utcnow().isoformat()
    
    event_id = await system_events_crud.create(event_dict)
    created_event = await system_events_crud.get_by_id(event_id)
    
    return serialize_datetime_fields(created_event)