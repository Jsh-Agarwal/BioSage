from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel
from pydantic import field_validator
from pydantic import Field
from pydantic import AliasChoices
from pydantic import ConfigDict

class IntakeDemographics(BaseModel):
    age: Optional[int] = None
    sex: Optional[Literal["M", "F", "Other"]] = None

class IntakeVitals(BaseModel):
    temp_c: Optional[float] = None
    hr: Optional[int] = None
    bp_sys: Optional[int] = None
    bp_dia: Optional[int] = None
    spo2: Optional[int] = None

class Intake(BaseModel):
    patient_id: str
    demographics: IntakeDemographics
    vitals: IntakeVitals
    symptoms_free_text: str
    duration_days: Optional[int] = None
    comorbidities: List[str] = []
    meds: List[str] = []
    travel: List[str] = []
    exposures: List[str] = []
    initial_labs: Dict[str, Any] = {}
    flags: Dict[str, Any] = {}

class NormalizedIntake(BaseModel):
    intake: Intake
    symptoms_normalized: List[str]
    codes: Dict[str, str] = {}

class Citation(BaseModel):
    doc_id: str
    span: str

class Candidate(BaseModel):
    diagnosis: str
    rationale: str
    citations: List[Citation]
    graph_paths: List[List[str]] = []
    confidence_qual: Literal["low", "medium", "high"]
    score_local: Optional[float] = None

class AgentResult(BaseModel):
    agent: Literal[
        "infectious",
        "autoimmune",
        "cardiology",
        "neurology",
        "oncology",
        "toxicology",
    ]
    candidates: List[Candidate]

class DifferentialItem(BaseModel):
    diagnosis: str
    score_global: float
    why_top: str
    citations: List[Citation] = []
    graph_paths: List[List[str]] = []

class NextBestTest(BaseModel):
    name: str
    why: str
    linked_hypotheses: List[str]
    graph_edges: List[List[str]] = []

class ClarifyRequest(BaseModel):
    normalized_intake: NormalizedIntake
    top_uncertainties: List[str]  # e.g., ["Dengue", "Malaria"]

class ClarifyResponse(BaseModel):
    questions: List[str]  # 1-3 yes/no questions

class TestPlanItem(BaseModel):
    diagnosis: str
    plan: str  # e.g., "If NS1 positive → Dengue; if negative → order thick smear"

class FusedOutput(BaseModel):
    differential: List[DifferentialItem]
    next_best_test: NextBestTest
    disagreement_score: Optional[float] = None
    test_plans: List[TestPlanItem] = []

class DiagnoseResult(BaseModel):
    agents: List[AgentResult]
    fused: FusedOutput
    recommendations: List["Recommendation"] = []


# PatientData (incoming schema derived from misc/patient_data.txt)
class PatientBasic(BaseModel):
    name: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    mrn: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    emergency_contact: Optional[str] = None
    insurance: Optional[str] = None
    primary_care: Optional[str] = None


class PatientCase(BaseModel):
    case_id: Optional[str] = None
    patient_id: Optional[str] = None
    chief_complaint: Optional[str] = None
    admission_date: Optional[str] = None
    status: Optional[str] = None
    current_dx: Optional[str] = None
    assigned_team: List[str] = []
    diagnosed: Optional[bool] = False


class PatientVitals(BaseModel):
    temperature: Optional[str] = None
    bp: Optional[str] = None
    hr: Optional[str] = None
    rr: Optional[str] = None
    o2sat: Optional[str] = None
    weight: Optional[str] = None


class PatientTest(BaseModel):
    test: Optional[str] = None
    value: Optional[str] = None
    reference: Optional[str] = None
    status: Optional[str] = None
    date: Optional[str] = None


class PatientAllergy(BaseModel):
    allergen: Optional[str] = None
    reaction: Optional[str] = None
    severity: Optional[str] = None


class PatientMedication(BaseModel):
    name: Optional[str] = None
    dose: Optional[str] = None
    indication: Optional[str] = None
    started: Optional[str] = None
    status: Optional[str] = None


class PatientCondition(BaseModel):
    condition: Optional[str] = None
    diagnosed: Optional[str] = None
    status: Optional[str] = None


class PatientSurgery(BaseModel):
    procedure: Optional[str] = None
    date: Optional[str] = None
    complications: Optional[str] = None


class PatientMedicalHistory(BaseModel):
    _id: Optional[str] = None
    patient_id: Optional[str] = None
    allergies: List[PatientAllergy] = []
    medications: List[PatientMedication] = []
    conditions: List[PatientCondition] = []
    surgeries: List[PatientSurgery] = []

    # Accept simpler inputs like ["Penicillin"] or "Penicillin" and coerce
    @field_validator('allergies', mode='before')
    @classmethod
    def _coerce_allergies(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            return [{"allergen": v}]
        if isinstance(v, list):
            coerced = []
            for item in v:
                if isinstance(item, str):
                    coerced.append({"allergen": item})
                else:
                    coerced.append(item)
            return coerced
        return v

    @field_validator('medications', mode='before')
    @classmethod
    def _coerce_medications(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            return [{"name": v}]
        if isinstance(v, list):
            coerced = []
            for item in v:
                if isinstance(item, str):
                    coerced.append({"name": item})
                else:
                    coerced.append(item)
            return coerced
        return v

    @field_validator('conditions', mode='before')
    @classmethod
    def _coerce_conditions(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            return [{"condition": v}]
        if isinstance(v, list):
            coerced = []
            for item in v:
                if isinstance(item, str):
                    coerced.append({"condition": item})
                else:
                    coerced.append(item)
            return coerced
        return v

    @field_validator('surgeries', mode='before')
    @classmethod
    def _coerce_surgeries(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            return [{"procedure": v}]
        if isinstance(v, list):
            coerced = []
            for item in v:
                if isinstance(item, str):
                    coerced.append({"procedure": item})
                else:
                    coerced.append(item)
            return coerced
        return v


class PatientSocialHistory(BaseModel):
    _id: Optional[str] = None
    patient_id: Optional[str] = None
    occupation: Optional[str] = None
    smoking: Optional[str] = None
    alcohol: Optional[str] = None
    drugs: Optional[str] = None
    exercise: Optional[str] = None
    diet: Optional[str] = None
    travel: Optional[str] = None
    exposure: Optional[str] = None


class PatientData(BaseModel):
    # Allow both "patient" and legacy "basic"; allow both "labs" and legacy "tests"
    model_config = ConfigDict(populate_by_name=True)

    patient: Optional[PatientBasic] = Field(
        None,
        validation_alias=AliasChoices('patient', 'basic')
    )
    case: Optional[PatientCase] = None
    vitals: Optional[PatientVitals] = None
    labs: Optional[List[PatientTest]] = Field(
        default_factory=list,
        validation_alias=AliasChoices('labs', 'tests')
    )
    medical_history: Optional[PatientMedicalHistory] = None
    social_history: Optional[PatientSocialHistory] = None


class Recommendation(BaseModel):
    title: str
    rationale: str
    priority: Literal["low", "medium", "high"] = "medium"

