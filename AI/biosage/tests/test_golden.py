import os
import json
import pytest
from biosage.core.orchestrator import diagnose_patient
from biosage.core.schemas import Intake, PatientData, PatientBasic, PatientVitals, PatientMedicalHistory, PatientSocialHistory, PatientCase

# Set fixed seed for reproducibility
os.environ['OPENAI_SEED'] = '42'  # If OpenAI supports seed

def load_golden_cases():
    golden_dir = os.path.join(os.path.dirname(__file__), 'golden')
    cases = []
    for filename in os.listdir(golden_dir):
        if filename.endswith('.json'):
            with open(os.path.join(golden_dir, filename), 'r') as f:
                cases.append(json.load(f))
    return cases

@pytest.mark.asyncio
@pytest.mark.parametrize("case_data", load_golden_cases())
async def test_golden_case_stability(case_data):
    """Test that golden cases produce stable outputs with citations and KG paths."""
    # Preprocess intake data to match Intake schema
    intake_data = case_data['intake'].copy()
    intake_data['patient_id'] = case_data['case_id']
    intake_data['symptoms_free_text'] = ', '.join(intake_data.pop('symptoms'))
    
    # Map demographics fields
    demo = intake_data['demographics']
    if 'gender' in demo:
        gender = demo.pop('gender')
        if gender == 'female':
            demo['sex'] = 'F'
        elif gender == 'male':
            demo['sex'] = 'M'
        else:
            demo['sex'] = 'Other'
    
    # Map vitals fields
    vitals = intake_data['vitals']
    if 'temperature' in vitals:
        vitals['temp_c'] = vitals.pop('temperature')
    if 'oxygen_sat' in vitals:
        vitals['spo2'] = vitals.pop('oxygen_sat')
    
    # Build PatientData from the normalized Intake-like dict (minimal fields used by transform)
    basic = PatientBasic(mrn=intake_data.get('patient_id'))
    vitals_pd = PatientVitals(temperature=str(vitals.get('temp_c')) if vitals.get('temp_c') is not None else None,
                              bp=None, hr=str(vitals.get('hr')) if vitals.get('hr') is not None else None,
                              rr=None, o2sat=str(vitals.get('spo2')) if vitals.get('spo2') is not None else None)
    case_pd = PatientCase(chief_complaint=intake_data.get('symptoms_free_text'))
    medhist_pd = PatientMedicalHistory()
    social_pd = PatientSocialHistory()
    patient = PatientData(basic=basic, case=case_pd, vitals=vitals_pd, medical_history=medhist_pd, social_history=social_pd, tests=[])
    result = await diagnose_patient(patient)

    # Check infectious agent
    infectious = next((a for a in result.agents if a.agent == 'infectious'), None)
    assert infectious is not None, "Infectious agent missing"
    assert len(infectious.candidates) > 0, "No infectious candidates"

    # Check autoimmune agent
    autoimmune = next((a for a in result.agents if a.agent == 'autoimmune'), None)
    assert autoimmune is not None, "Autoimmune agent missing"
    assert len(autoimmune.candidates) > 0, "No autoimmune candidates"

    # Check fused output
    assert len(result.fused.differential) > 0, "No fused differential"
    assert result.fused.next_best_test is not None, "No next best test"

    # Check citations presence
    for agent in result.agents:
        for cand in agent.candidates:
            if case_data['expected']['citations_required']:
                assert len(cand.citations) > 0, f"No citations for {cand.diagnosis}"

    # Check KG paths
    for agent in result.agents:
        for cand in agent.candidates:
            if case_data['expected']['kg_paths_required']:
                assert len(cand.graph_paths) > 0, f"No KG paths for {cand.diagnosis}"

    # Check expected coverage (at least one expected diagnosis appears)
    all_candidates = [c.diagnosis for a in result.agents for c in a.candidates]
    expected_infectious = case_data['expected']['infectious_candidates']
    expected_autoimmune = case_data['expected']['autoimmune_candidates']
    all_diag_str = ' '.join(all_candidates).lower()
    has_infectious_match = any(exp.lower() in all_diag_str for exp in expected_infectious)
    has_autoimmune_match = any(exp.lower() in all_diag_str for exp in expected_autoimmune)
    assert has_infectious_match or has_autoimmune_match, f"No expected diagnoses in {all_candidates}. Expected infectious: {expected_infectious}, autoimmune: {expected_autoimmune}"
