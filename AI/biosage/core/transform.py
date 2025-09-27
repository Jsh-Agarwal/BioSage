from typing import Optional
from datetime import datetime

from .schemas import (
    PatientData,
    Intake,
    IntakeVitals,
    IntakeDemographics,
)


def _sex_from_gender(gender: Optional[str]) -> Optional[str]:
    if not gender:
        return None
    g = gender.strip().lower()
    if g in ("m", "male", "man"):
        return "M"
    if g in ("f", "female", "woman"):
        return "F"
    return "Other"


def _age_from_dob(dob: Optional[str]) -> Optional[int]:
    if not dob:
        return None
    try:
        # Try common formats
        for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%m/%d/%Y", "%d/%m/%Y"):
            try:
                dt = datetime.strptime(dob, fmt)
                break
            except Exception:
                dt = None
        if not dt:
            return None
        today = datetime.utcnow().date()
        age = today.year - dt.year - ((today.month, today.day) < (dt.month, dt.day))
        return int(age)
    except Exception:
        return None


def patient_data_to_intake(p: PatientData) -> Intake:
    # demographics
    age = _age_from_dob(p.patient.get("dob") if isinstance(p.patient, dict) else getattr(p.patient, "dob", None)) if p.patient else None
    gender = p.patient.get("gender") if isinstance(p.patient, dict) else getattr(p.patient, "gender", None) if p.patient else None
    sex = _sex_from_gender(gender)
    demographics = IntakeDemographics(age=age, sex=sex)

    # vitals
    vitals_in = p.vitals or {}
    def _parse_float(val):
        try:
            return float(str(val).strip())
        except Exception:
            return None
    temp_c = _parse_float(vitals_in.get("temperature") if isinstance(vitals_in, dict) else getattr(vitals_in, "temperature", None))
    hr = None
    if isinstance(vitals_in, dict):
        try:
            hr = int(str(vitals_in.get("hr")).strip()) if vitals_in.get("hr") is not None else None
        except Exception:
            hr = None
    else:
        try:
            hr = int(str(getattr(vitals_in, "hr", None)).strip()) if getattr(vitals_in, "hr", None) is not None else None
        except Exception:
            hr = None
    # bp as "120/80"
    bp_sys = None
    bp_dia = None
    bp_value = vitals_in.get("bp") if isinstance(vitals_in, dict) else getattr(vitals_in, "bp", None)
    if bp_value and isinstance(bp_value, str) and "/" in bp_value:
        try:
            parts = bp_value.replace(" ", "").split("/")
            bp_sys = int(parts[0])
            bp_dia = int(parts[1])
        except Exception:
            bp_sys = None
            bp_dia = None
    spo2 = None
    o2 = vitals_in.get("o2sat") if isinstance(vitals_in, dict) else getattr(vitals_in, "o2sat", None)
    try:
        spo2 = int(str(o2).strip()) if o2 is not None else None
    except Exception:
        spo2 = None
    vitals = IntakeVitals(temp_c=temp_c, hr=hr, bp_sys=bp_sys, bp_dia=bp_dia, spo2=spo2)

    # symptoms and narrative
    complaint = None
    if p.case:
        complaint = p.case.get("chief_complaint") if isinstance(p.case, dict) else getattr(p.case, "chief_complaint", None)
    mh = p.medical_history or {}
    meds_list = []
    if isinstance(mh, dict):
        meds = mh.get("medications") or []
        for m in meds:
            name = m.get("name") if isinstance(m, dict) else getattr(m, "name", "")
            dose = m.get("dose") if isinstance(m, dict) else getattr(m, "dose", "")
            if name:
                meds_list.append(f"{name} {dose}".strip())
    conditions_list = []
    if isinstance(mh, dict):
        conds = mh.get("conditions") or []
        for c in conds:
            condition = c.get("condition") if isinstance(c, dict) else getattr(c, "condition", "")
            if condition:
                conditions_list.append(condition)
    allergies_list = []
    if isinstance(mh, dict):
        alls = mh.get("allergies") or []
        for a in alls:
            allergen = a.get("allergen") if isinstance(a, dict) else getattr(a, "allergen", "")
            reaction = a.get("reaction") if isinstance(a, dict) else getattr(a, "reaction", "")
            if allergen:
                allergies_list.append(f"allergy:{allergen} {reaction}".strip())

    narrative_parts = [complaint or ""] + conditions_list + allergies_list
    symptoms_free_text = "; ".join([s for s in narrative_parts if s])

    # travel/exposures from social history
    travel = []
    exposures = []
    sh = p.social_history or {}
    if isinstance(sh, dict):
        if sh.get("travel"):
            travel = [sh.get("travel")] if isinstance(sh.get("travel"), str) else list(sh.get("travel") or [])
        if sh.get("exposure"):
            exposures = [sh.get("exposure")] if isinstance(sh.get("exposure"), str) else list(sh.get("exposure") or [])

    # initial labs from labs/tests list
    initial_labs = {}
    labs_in = getattr(p, 'labs', None)
    if labs_in and isinstance(labs_in, list):
        for t in labs_in:
            test_name = t.get("test") if isinstance(t, dict) else getattr(t, "test", None)
            val = t.get("value") if isinstance(t, dict) else getattr(t, "value", None)
            if test_name and val is not None:
                initial_labs[str(test_name)] = val

    intake = Intake(
        patient_id=(p.patient.get("mrn") if isinstance(p.patient, dict) else getattr(p.patient, "mrn", "unknown")) if p.patient else "unknown",
        demographics=demographics,
        vitals=vitals,
        symptoms_free_text=symptoms_free_text,
        duration_days=None,
        comorbidities=conditions_list,
        meds=meds_list,
        travel=travel,
        exposures=exposures,
        initial_labs=initial_labs,
        flags={},
    )
    return intake


