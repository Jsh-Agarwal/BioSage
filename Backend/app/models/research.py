from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from enum import Enum
from .base import BaseDBModel

# Research Suggestions Model
class ResearchPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class ResearchSuggestions(BaseDBModel):
    title: str
    category: str
    confidence: float = Field(..., ge=0, le=1)
    relevance: str
    description: str
    suggested_actions: List[str] = []
    similar_cases: int = 0
    literature: int = 0
    priority: ResearchPriority

# Clinical Trials Model
class TrialPhase(str, Enum):
    PHASE_I = "Phase I"
    PHASE_II = "Phase II"
    PHASE_III = "Phase III"
    PHASE_IV = "Phase IV"

class TrialStatus(str, Enum):
    RECRUITING = "recruiting"
    ACTIVE = "active"
    COMPLETED = "completed"
    SUSPENDED = "suspended"
    TERMINATED = "terminated"

class ClinicalTrials(BaseDBModel):
    title: str
    phase: TrialPhase
    status: TrialStatus
    location: str
    estimated_enrollment: int
    eligibility: str
    primary_endpoint: str
    contact_info: str
    match_score: float = Field(..., ge=0, le=1)
    distance: Optional[str] = None

# Evidence Model
class EvidenceType(str, Enum):
    SYSTEMATIC_REVIEW = "systematic_review"
    RCT = "rct"
    COHORT_STUDY = "cohort_study"
    CASE_CONTROL = "case_control"
    CASE_SERIES = "case_series"
    EXPERT_OPINION = "expert_opinion"

class Evidence(BaseDBModel):
    title: str
    authors: str
    journal: str
    year: int
    citation_count: int = 0
    quality_score: float = Field(..., ge=0, le=1)
    evidence_type: EvidenceType
    key_findings: str
    relevance_score: float = Field(..., ge=0, le=1)
    tags: List[str] = []

# Collaboration Models
class ParticipantStatus(str, Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    AWAY = "away"

class DiscussionStatus(str, Enum):
    OPEN = "open"
    CLOSED = "closed"
    ARCHIVED = "archived"

class DiscussionPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class MessageType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    FILE = "file"
    SYSTEM = "system"

class Participant(BaseModel):
    id: str
    name: str
    role: str
    avatar: Optional[str] = None
    status: ParticipantStatus
    last_seen: str

class Discussion(BaseModel):
    id: str
    title: str
    participants: int
    messages: int
    last_activity: str
    status: DiscussionStatus
    priority: DiscussionPriority

class Reactions(BaseModel):
    thumbsUp: int = 0
    thumbsDown: int = 0

class ChatMessage(BaseModel):
    id: str
    sender: str
    message: str
    timestamp: str
    type: MessageType
    reactions: Reactions = Reactions()

class PinnedItem(BaseModel):
    id: str
    type: str
    title: str
    content: str
    pinned_by: str
    timestamp: str

class Collaborations(BaseDBModel):
    case_id: str
    participants: List[Participant] = []
    discussions: List[Discussion] = []
    chat_messages: List[ChatMessage] = []
    pinned_items: List[PinnedItem] = []

# Create/Response schemas
class ResearchSuggestionsResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    id: str = Field(..., alias="_id")
    title: str
    category: str
    confidence: float
    relevance: str
    description: str
    suggested_actions: List[str]
    similar_cases: int
    literature: int
    priority: ResearchPriority

class ClinicalTrialsResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    id: str = Field(..., alias="_id")
    title: str
    phase: TrialPhase
    status: TrialStatus
    location: str
    estimated_enrollment: int
    eligibility: str
    primary_endpoint: str
    contact_info: str
    match_score: float
    distance: Optional[str] = None

class EvidenceResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    id: str = Field(..., alias="_id")
    title: str
    authors: str
    journal: str
    year: int
    citation_count: int
    quality_score: float
    evidence_type: EvidenceType
    key_findings: str
    relevance_score: float
    tags: List[str]

class CollaborationsResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    id: str = Field(..., alias="_id")
    case_id: str
    participants: List[Participant]
    discussions: List[Discussion]
    chat_messages: List[ChatMessage]
    pinned_items: List[PinnedItem]