from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from pydantic import BaseModel
from ..core.schemas import PatientData
from ..core.orchestrator import diagnose_patient
from ..core.evidence import EVIDENCE
import math
from typing import Any

app = FastAPI(title="BioSage API")

# CORS for frontend/ngrok access
origins_env = os.getenv("CORS_ORIGINS", "*")
allow_origins = [o.strip() for o in origins_env.split(",")] if origins_env else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins if allow_origins != [""] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class DiagnoseRequest(PatientData):
    pass


def _sanitize_for_response(obj: Any) -> Any:
    # Remove graph fields and ensure floats are JSON-safe
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            if k in ("graph_paths", "graph_edges"):
                continue
            out[k] = _sanitize_for_response(v)
        return out
    if isinstance(obj, list):
        return [_sanitize_for_response(x) for x in obj]
    if isinstance(obj, float):
        return float(obj) if math.isfinite(obj) else 0.0
    return obj


@app.post('/diagnose')
async def diagnose_endpoint(req: DiagnoseRequest):
    try:
        # Determine identifiers early and mark diagnosed in Mongo 'cases' (best-effort)
        basic = getattr(req, 'patient', None)
        mrn = None
        if isinstance(basic, dict):
            mrn = basic.get('mrn')
        else:
            mrn = getattr(basic, 'mrn', None) if basic is not None else None

        case_info = getattr(req, 'case', None)
        patient_id = None
        case_id = None
        if isinstance(case_info, dict):
            patient_id = case_info.get('patient_id')
            case_id = case_info.get('case_id')
        else:
            patient_id = getattr(case_info, 'patient_id', None) if case_info is not None else None
            case_id = getattr(case_info, 'case_id', None) if case_info is not None else None

        try:
            EVIDENCE.mark_case_diagnosed(patient_id=patient_id, case_id=case_id)
        except Exception:
            pass

        result = await diagnose_patient(req)
        print(result)
        data = result.model_dump()
        data = _sanitize_for_response(data)
        # Store the exact returned payload in Mongo results collection (best-effort)
        try:
            result_key = patient_id or mrn or 'unknown'
            EVIDENCE.put_result(result_key, data)
        except Exception:
            pass
        return data
    except Exception as e:
        raise HTTPException(500, detail=str(e))

@app.get('/evidence/{case_id}')
async def evidence_endpoint(case_id: str):
    return EVIDENCE.get(case_id)


@app.get('/cases/{patient_id}')
async def case_doc_endpoint(patient_id: str):
    try:
        doc = EVIDENCE.get_case_doc(patient_id)
        return _sanitize_for_response(doc)
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@app.get('/diagnosed_result/{patient_id}')
async def diagnosed_result_endpoint(patient_id: str):
    try:
        res = EVIDENCE.get_result(patient_id)
        return _sanitize_for_response(res)
    except Exception as e:
        raise HTTPException(500, detail=str(e))
