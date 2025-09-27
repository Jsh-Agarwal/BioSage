import asyncio
from .schemas import (
    Intake,
    NormalizedIntake,
    AgentResult,
    DiagnoseResult,
    PatientData,
)
from .normalize import normalize_symptoms
from ..agents.infectious import run_agent as run_infectious
from ..agents.autoimmune import run_agent as run_autoimmune
from ..agents.cardiology import run_agent as run_cardiology
from ..agents.neurology import run_agent as run_neurology
from ..agents.oncology import run_agent as run_oncology
from ..agents.toxicology import run_agent as run_toxicology
from ..agents.integrator import integrate
from .evidence import EVIDENCE
from .transform import patient_data_to_intake
from .recommendations import generate_recommendations


def normalize(intake: Intake) -> NormalizedIntake:
    norm, codes = normalize_symptoms(intake.symptoms_free_text)
    return NormalizedIntake(intake=intake, symptoms_normalized=norm, codes=codes)


async def diagnose_patient(patient: PatientData) -> DiagnoseResult:
    # Master Agent entrypoint: transform incoming patient data → Intake, then run pipeline
    intake = patient_data_to_intake(patient)
    norm = normalize(intake)
    ctx = {"norm": norm.model_dump()}

    # Run specialist agents in parallel
    id_task = asyncio.create_task(run_infectious(ctx))
    ai_task = asyncio.create_task(run_autoimmune(ctx))
    card_task = asyncio.create_task(run_cardiology(ctx))
    neuro_task = asyncio.create_task(run_neurology(ctx))
    onco_task = asyncio.create_task(run_oncology(ctx))
    tox_task = asyncio.create_task(run_toxicology(ctx))
    id_out, ai_out, card_out, neuro_out, onco_out, tox_out = await asyncio.gather(
        id_task, ai_task, card_task, neuro_task, onco_task, tox_task
    )

    fused = integrate([id_out, ai_out, card_out, neuro_out, onco_out, tox_out], ctx)

    # Recommendations
    recs = generate_recommendations(ctx.get("norm", {}), fused)

    # Persist evidence (bundle includes context)
    EVIDENCE.put(intake.patient_id, {
        "intake": intake.model_dump(),
        "normalized": norm.model_dump(),
        "agents": {
            "infectious": id_out.model_dump(),
            "autoimmune": ai_out.model_dump(),
            "cardiology": card_out.model_dump(),
            "neurology": neuro_out.model_dump(),
            "oncology": onco_out.model_dump(),
            "toxicology": tox_out.model_dump(),
        },
        "fused": fused.model_dump(),
        "evidence": [{"type": "context", "content": ctx}]
    })

    return DiagnoseResult(agents=[id_out, ai_out, card_out, neuro_out, onco_out, tox_out], fused=fused, recommendations=recs)
