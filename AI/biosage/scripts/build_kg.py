# build_complex_med_kg.py
# Requires: biosage.core.kg (init_db, get_conn, upsert_entity, add_relation, to_networkx, add_test_prior)

from biosage.core.kg import init_db, get_conn, upsert_entity, add_relation, to_networkx, add_test_prior

def E(c, name, etype):
    """Upsert helper returning the entity id."""
    return upsert_entity(c, name, etype)

if __name__ == '__main__':
    print('Initializing multi-domain medical KG (infectious, autoimmune, cardiology, neurology, oncology, toxicology)...')
    init_db()

    with get_conn() as c:
        # --- Diseases (infectious) ---
        dengue   = E(c, 'Dengue', 'Disease')
        malaria  = E(c, 'Malaria (P. falciparum/vivax)', 'Disease')
        influenza= E(c, 'Influenza', 'Disease')
        covid19  = E(c, 'COVID-19', 'Disease')
        tb       = E(c, 'Tuberculosis', 'Disease')
        typhoid  = E(c, 'Enteric fever (Typhoid/Paratyphoid)', 'Disease')
        cap      = E(c, 'Community-acquired pneumonia', 'Disease')
        uti      = E(c, 'Urinary tract infection', 'Disease')

        # --- Diseases (autoimmune / autoinflammatory) ---
        sle      = E(c, 'Systemic lupus erythematosus', 'Disease')
        ra       = E(c, 'Rheumatoid arthritis', 'Disease')
        aspond   = E(c, 'Axial spondyloarthritis', 'Disease')
        sjogren  = E(c, "Sjögren's syndrome", 'Disease')
        aav      = E(c, 'ANCA-associated vasculitis', 'Disease')
        ibd      = E(c, 'Inflammatory bowel disease (UC/Crohn’s)', 'Disease')
        aitd     = E(c, 'Autoimmune thyroid disease', 'Disease')
        stills   = E(c, "Adult-onset Still's disease", 'Disease')

        # --- Diseases (cardiology) ---
        acs      = E(c, 'Acute coronary syndrome', 'Disease')
        afib     = E(c, 'Atrial fibrillation', 'Disease')
        hf       = E(c, 'Heart failure (HFrEF/HFpEF)', 'Disease')
        as_vlv   = E(c, 'Aortic stenosis', 'Disease')
        pericard = E(c, 'Acute pericarditis', 'Disease')

        # --- Diseases (neurology) ---
        stroke   = E(c, 'Ischemic stroke', 'Disease')
        tia      = E(c, 'Transient ischemic attack', 'Disease')
        seizure  = E(c, 'Generalized seizure', 'Disease')
        migraine = E(c, 'Migraine with aura', 'Disease')
        gbs      = E(c, 'Guillain-Barré syndrome', 'Disease')

        # --- Diseases (oncology) ---
        lung_ca  = E(c, 'Lung cancer (NSCLC/SCLC)', 'Disease')
        lymphoma = E(c, 'Non-Hodgkin lymphoma', 'Disease')
        aml      = E(c, 'Acute myeloid leukemia', 'Disease')

        # --- Diseases (toxicology) ---
        opioid_od   = E(c, 'Opioid overdose', 'Disease')
        organophos  = E(c, 'Organophosphate poisoning', 'Disease')
        apap_tox    = E(c, 'Acetaminophen toxicity', 'Disease')

        # --- Symptoms / Signs ---
        fever        = E(c, 'Fever', 'Symptom')
        chills       = E(c, 'Rigors/chills', 'Symptom')
        myalgia      = E(c, 'Myalgia', 'Symptom')
        headache     = E(c, 'Headache', 'Symptom')
        arthralgia   = E(c, 'Arthralgia', 'Symptom')
        arthritis    = E(c, 'Inflammatory polyarthritis', 'Symptom')
        malar_rash   = E(c, 'Rash-malar', 'Symptom')
        photosens    = E(c, 'Photosensitivity', 'Symptom')
        oral_ulcers  = E(c, 'Oral/nasal ulcers', 'Symptom')
        pleuritic_cp = E(c, 'Pleuritic chest pain', 'Symptom')
        chest_pressure = E(c, 'Chest pain (pressure-like)', 'Symptom')
        dry_cough    = E(c, 'Dry cough', 'Symptom')
        productive_c = E(c, 'Productive cough', 'Symptom')
        dyspnea      = E(c, 'Dyspnea', 'Symptom')
        sore_throat  = E(c, 'Sore throat', 'Symptom')
        ageusia      = E(c, 'Ageusia/anosmia', 'Symptom')
        malar_heme   = E(c, 'Petechiae/ecchymoses', 'Symptom')
        hematuria_sx = E(c, 'Hematuria (symptom)', 'Symptom')
        flank_pain   = E(c, 'Flank pain', 'Symptom')
        night_sweats = E(c, 'Night sweats', 'Symptom')
        weight_loss  = E(c, 'Unintentional weight loss', 'Symptom')
        back_pain    = E(c, 'Inflammatory back pain', 'Symptom')
        diarrhea     = E(c, 'Chronic diarrhea', 'Symptom')
        sicca        = E(c, 'Dry eyes/mouth (sicca)', 'Symptom')
        soar_rash    = E(c, 'Salmon-colored rash (evanescent)', 'Symptom')
        palpitations = E(c, 'Palpitations', 'Symptom')
        syncope      = E(c, 'Syncope', 'Symptom')
        orthopnea    = E(c, 'Orthopnea', 'Symptom')
        edema        = E(c, 'Peripheral edema', 'Symptom')
        focal_weak   = E(c, 'Focal weakness', 'Symptom')
        aphasia      = E(c, 'Aphasia', 'Symptom')
        visual_loss  = E(c, 'Visual field loss', 'Symptom')
        aura_visual  = E(c, 'Visual aura', 'Symptom')
        convulsion   = E(c, 'Convulsion', 'Symptom')
        ascending_wk = E(c, 'Ascending weakness', 'Symptom')
        areflexia    = E(c, 'Areflexia', 'Symptom')
        lymph_nodes  = E(c, 'Lymphadenopathy', 'Symptom')
        hemoptysis   = E(c, 'Hemoptysis', 'Symptom')
        miosis       = E(c, 'Miosis (pinpoint pupils)', 'Symptom')
        resp_depr    = E(c, 'Respiratory depression', 'Symptom')
        salivation   = E(c, 'Excessive salivation', 'Symptom')
        bronchorrhea = E(c, 'Bronchorrhea', 'Symptom')
        nausea       = E(c, 'Nausea/Vomiting', 'Symptom')
        ruq_pain     = E(c, 'Right upper quadrant pain', 'Symptom')

        # --- Labs (patterns/features) ---
        thromb       = E(c, 'Thrombocytopenia', 'Lab')
        leukopenia   = E(c, 'Leukopenia/lymphopenia', 'Lab')
        leukocytosis = E(c, 'Leukocytosis (neutrophilic)', 'Lab')
        transaminitis= E(c, 'Transaminitis', 'Lab')
        hyperferrit  = E(c, 'Hyperferritinemia', 'Lab')
        crp_esr_up   = E(c, 'Elevated CRP/ESR', 'Lab')
        d_dimer_up   = E(c, 'Elevated D-dimer', 'Lab')
        hypoNa       = E(c, 'Hyponatremia', 'Lab')
        proteinuria  = E(c, 'Proteinuria', 'Lab')
        hematuria    = E(c, 'Hematuria (urinalysis)', 'Lab')
        rbc_casts    = E(c, 'RBC casts', 'Lab')
        rf_pos       = E(c, 'RF positive', 'Lab')
        anti_ccp_pos = E(c, 'Anti-CCP positive', 'Lab')
        ana_pos      = E(c, 'ANA positive', 'Lab')
        dsDNA_up     = E(c, 'Anti-dsDNA high', 'Lab')
        low_c3c4     = E(c, 'Low complement (C3/C4)', 'Lab')
        hla_b27      = E(c, 'HLA-B27 positive', 'Lab')
        anca_pos     = E(c, 'ANCA positive (MPO/PR3)', 'Lab')
        tsh_abn      = E(c, 'Abnormal TSH', 'Lab')
        tpo_ab       = E(c, 'TPO antibodies positive', 'Lab')
        lft_cholest  = E(c, 'Cholestatic LFT pattern', 'Lab')
        anemia       = E(c, 'Anemia of chronic disease', 'Lab')
        troponin_up  = E(c, 'Troponin elevated', 'Lab')
        bnp_up       = E(c, 'BNP/NT-proBNP elevated', 'Lab')
        ldh_up       = E(c, 'LDH elevated', 'Lab')

        # --- Diagnostic tests (index/confirmatory/screening) ---
        ns1_igm      = E(c, 'Dengue NS1/IgM serology', 'Test')
        dengue_pcr   = E(c, 'Dengue RT-PCR', 'Test')
        mal_smear    = E(c, 'Malaria smear/RDT', 'Test')
        flu_pcr      = E(c, 'Influenza RT-PCR', 'Test')
        sars_cov2    = E(c, 'SARS-CoV-2 PCR/Ag', 'Test')
        sputum_afb   = E(c, 'Sputum AFB smear/PCR', 'Test')
        tb_igra      = E(c, 'TB IGRA/TST', 'Test')
        blood_cx     = E(c, 'Blood culture', 'Test')
        urine_cx     = E(c, 'Urine culture', 'Test')
        cxr          = E(c, 'Chest X-ray', 'Test')
        ct_chest     = E(c, 'CT chest', 'Test')
        crp_test     = E(c, 'CRP', 'Test')
        esr_test     = E(c, 'ESR', 'Test')
        ana_test     = E(c, 'ANA by IFA', 'Test')
        dsDNA_test   = E(c, 'Anti-dsDNA', 'Test')
        complement   = E(c, 'Complement (C3/C4)', 'Test')
        rf_test      = E(c, 'Rheumatoid factor', 'Test')
        anti_ccp     = E(c, 'Anti-CCP', 'Test')
        hla_b27_t    = E(c, 'HLA-B27 typing', 'Test')
        anca_test    = E(c, 'ANCA (MPO/PR3)', 'Test')
        uA           = E(c, 'Urinalysis', 'Test')
        ferritin_t   = E(c, 'Ferritin', 'Test')
        tsh_test     = E(c, 'TSH', 'Test')
        tpo_test     = E(c, 'Anti-TPO antibodies', 'Test')
        ecg          = E(c, '12-lead ECG', 'Test')
        trop_test    = E(c, 'High-sensitivity troponin', 'Test')
        tte          = E(c, 'Transthoracic echocardiogram', 'Test')
        ct_head      = E(c, 'CT head (non-contrast)', 'Test')
        mri_brain    = E(c, 'MRI brain', 'Test')
        eeg_test     = E(c, 'Electroencephalogram (EEG)', 'Test')
        csf_analysis = E(c, 'CSF analysis', 'Test')
        cbc_diff     = E(c, 'CBC with differential', 'Test')
        node_biopsy  = E(c, 'Lymph node excisional biopsy', 'Test')
        apap_level   = E(c, 'Serum acetaminophen level', 'Test')
        cholinest    = E(c, 'Serum cholinesterase', 'Test')
        abg          = E(c, 'Arterial blood gas', 'Test')

        # --- Relations: Infectious diseases ---
        add_relation(c, dengue,   'has_symptom', fever,        'guideline_dengue_001', 1.0)
        add_relation(c, dengue,   'has_symptom', myalgia,      'guideline_dengue_001', 1.0)
        add_relation(c, dengue,   'has_symptom', headache,     'guideline_dengue_001', 0.8)
        add_relation(c, dengue,   'has_symptom', malar_heme,   'guideline_dengue_001', 0.7)
        add_relation(c, dengue,   'associated_with_lab_pattern', thromb, 'guideline_dengue_001', 1.0)
        add_relation(c, dengue,   'associated_with_lab_pattern', leukopenia, 'guideline_dengue_001', 0.8)
        add_relation(c, dengue,   'suggests_test', ns1_igm,    'guideline_dengue_001', 1.0)
        add_relation(c, dengue,   'suggests_test', dengue_pcr, 'guideline_dengue_001', 0.9)

        add_relation(c, malaria,  'has_symptom', fever,        'who_malaria', 1.0)
        add_relation(c, malaria,  'has_symptom', chills,       'who_malaria', 1.0)
        add_relation(c, malaria,  'associated_with_lab_pattern', anemia, 'who_malaria', 0.7)
        add_relation(c, malaria,  'suggests_test', mal_smear,  'who_malaria', 1.0)

        add_relation(c, influenza,'has_symptom', fever,        'cdc_influenza', 0.9)
        add_relation(c, influenza,'has_symptom', myalgia,      'cdc_influenza', 0.9)
        add_relation(c, influenza,'has_symptom', sore_throat,  'cdc_influenza', 0.8)
        add_relation(c, influenza,'has_symptom', dry_cough,    'cdc_influenza', 0.8)
        add_relation(c, influenza,'suggests_test', flu_pcr,    'cdc_influenza', 1.0)

        add_relation(c, covid19,  'has_symptom', fever,        'who_covid19', 0.7)
        add_relation(c, covid19,  'has_symptom', dry_cough,    'who_covid19', 0.7)
        add_relation(c, covid19,  'has_symptom', dyspnea,      'who_covid19', 0.6)
        add_relation(c, covid19,  'has_symptom', ageusia,      'who_covid19', 0.6)
        add_relation(c, covid19,  'associated_with_lab_pattern', lymphopenia, 'who_covid19', 0.6) if 'lymphopenia' in locals() else None
        add_relation(c, covid19,  'associated_with_lab_pattern', d_dimer_up, 'who_covid19', 0.6)
        add_relation(c, covid19,  'suggests_test', sars_cov2,  'who_covid19', 1.0)
        add_relation(c, covid19,  'suggests_test', cxr,        'who_covid19', 0.6)

        add_relation(c, cap,      'has_symptom', fever,        'cap_guideline', 0.8)
        add_relation(c, cap,      'has_symptom', productive_c, 'cap_guideline', 0.8)
        add_relation(c, cap,      'has_symptom', pleuritic_cp, 'cap_guideline', 0.6)
        add_relation(c, cap,      'suggests_test', cxr,        'cap_guideline', 1.0)
        add_relation(c, cap,      'suggests_test', blood_cx,   'cap_guideline', 0.5)

        add_relation(c, uti,      'has_symptom', fever,        'uti_guideline', 0.5)
        add_relation(c, uti,      'has_symptom', hematuria_sx, 'uti_guideline', 0.6)
        add_relation(c, uti,      'has_symptom', flank_pain,   'uti_guideline', 0.7)
        add_relation(c, uti,      'associated_with_lab_pattern', leukocytosis, 'uti_guideline', 0.6)
        add_relation(c, uti,      'suggests_test', uA,         'uti_guideline', 1.0)
        add_relation(c, uti,      'suggests_test', urine_cx,   'uti_guideline', 1.0)

        add_relation(c, tb,       'has_symptom', fever,        'tb_guideline', 0.7)
        add_relation(c, tb,       'has_symptom', night_sweats, 'tb_guideline', 0.7)
        add_relation(c, tb,       'has_symptom', weight_loss,  'tb_guideline', 0.7)
        add_relation(c, tb,       'suggests_test', sputum_afb, 'tb_guideline', 1.0)
        add_relation(c, tb,       'suggests_test', tb_igra,    'tb_guideline', 0.7)
        add_relation(c, tb,       'suggests_test', cxr,        'tb_guideline', 0.8)
        add_relation(c, tb,       'suggests_test', ct_chest,   'tb_guideline', 0.6)

        add_relation(c, typhoid,  'has_symptom', fever,        'enteric_fever', 0.9)
        add_relation(c, typhoid,  'has_symptom', headache,     'enteric_fever', 0.6)
        add_relation(c, typhoid,  'associated_with_lab_pattern', leukopenia, 'enteric_fever', 0.5)
        add_relation(c, typhoid,  'suggests_test', blood_cx,   'enteric_fever', 1.0)

        # --- Relations: Autoimmune cluster ---
        add_relation(c, sle,      'has_symptom', malar_rash,   'sle_review_2018', 1.0)
        add_relation(c, sle,      'has_symptom', photosens,    'sle_review_2018', 0.8)
        add_relation(c, sle,      'has_symptom', oral_ulcers,  'sle_review_2018', 0.7)
        add_relation(c, sle,      'has_symptom', fever,        'sle_review_2018', 0.6)
        add_relation(c, sle,      'associated_with_lab_pattern', ana_pos,     'sle_review_2018', 1.0)
        add_relation(c, sle,      'associated_with_lab_pattern', dsDNA_up,    'sle_review_2018', 0.8)
        add_relation(c, sle,      'associated_with_lab_pattern', low_c3c4,    'sle_review_2018', 0.8)
        add_relation(c, sle,      'associated_with_lab_pattern', proteinuria, 'sle_review_2018', 0.7)
        add_relation(c, sle,      'associated_with_lab_pattern', hematuria,   'sle_review_2018', 0.6)
        add_relation(c, sle,      'suggests_test', ana_test,   'sle_review_2018', 1.0)
        add_relation(c, sle,      'suggests_test', dsDNA_test, 'sle_review_2018', 0.9)
        add_relation(c, sle,      'suggests_test', complement, 'sle_review_2018', 0.8)
        add_relation(c, sle,      'suggests_test', uA,         'sle_review_2018', 0.8)

        add_relation(c, ra,       'has_symptom', arthritis,    'ra_guideline', 1.0)
        add_relation(c, ra,       'has_symptom', morning_stiff:=E(c, 'Prolonged morning stiffness', 'Symptom'), 'ra_guideline', 0.9)
        add_relation(c, ra,       'associated_with_lab_pattern', rf_pos,       'ra_guideline', 0.7)
        add_relation(c, ra,       'associated_with_lab_pattern', anti_ccp_pos, 'ra_guideline', 0.9)
        add_relation(c, ra,       'suggests_test', rf_test,    'ra_guideline', 0.9)
        add_relation(c, ra,       'suggests_test', anti_ccp,   'ra_guideline', 1.0)
        add_relation(c, ra,       'associated_with_lab_pattern', crp_esr_up,   'ra_guideline', 0.8)

        add_relation(c, aspond,   'has_symptom', back_pain,    'axspa_guideline', 1.0)
        add_relation(c, aspond,   'associated_with_lab_pattern', hla_b27,      'axspa_guideline', 0.7)
        add_relation(c, aspond,   'suggests_test', hla_b27_t,  'axspa_guideline', 0.8)

        add_relation(c, sjogren,  'has_symptom', sicca,        'sjogren_guideline', 1.0)
        add_relation(c, sjogren,  'associated_with_lab_pattern', ana_pos,      'sjogren_guideline', 0.6)
        add_relation(c, sjogren,  'associated_with_lab_pattern', tpo_ab,       'sjogren_guideline', 0.4)

        add_relation(c, aav,      'has_symptom', hematuria_sx, 'aav_review', 0.6)
        add_relation(c, aav,      'associated_with_lab_pattern', anca_pos,     'aav_review', 1.0)
        add_relation(c, aav,      'associated_with_lab_pattern', rbc_casts,    'aav_review', 0.7)
        add_relation(c, aav,      'suggests_test', anca_test,  'aav_review', 1.0)
        add_relation(c, aav,      'suggests_test', uA,         'aav_review', 0.7)

        add_relation(c, ibd,      'has_symptom', diarrhea,     'ibd_review', 0.9)
        add_relation(c, ibd,      'associated_with_lab_pattern', crp_esr_up,  'ibd_review', 0.7)

        add_relation(c, aitd,     'associated_with_lab_pattern', tsh_abn,     'thyroid_review', 1.0)
        add_relation(c, aitd,     'associated_with_lab_pattern', tpo_ab,      'thyroid_review', 0.9)
        add_relation(c, aitd,     'suggests_test', tsh_test,   'thyroid_review', 1.0)
        add_relation(c, aitd,     'suggests_test', tpo_test,   'thyroid_review', 0.8)

        add_relation(c, stills,   'has_symptom', soar_rash,    'stills_review', 0.8)
        add_relation(c, stills,   'has_symptom', fever,        'stills_review', 1.0)
        add_relation(c, stills,   'associated_with_lab_pattern', hyperferrit, 'stills_review', 0.9)
        add_relation(c, stills,   'suggests_test', ferritin_t, 'stills_review', 0.9)

        # --- Relations: Cardiology cluster ---
        add_relation(c, acs,      'has_symptom', chest_pressure, 'cardio_acs', 1.0)
        add_relation(c, acs,      'has_symptom', dyspnea,        'cardio_acs', 0.6)
        add_relation(c, acs,      'associated_with_lab_pattern', troponin_up, 'cardio_acs', 1.0)
        add_relation(c, acs,      'suggests_test', ecg,          'cardio_acs', 1.0)
        add_relation(c, acs,      'suggests_test', trop_test,    'cardio_acs', 1.0)

        add_relation(c, afib,     'has_symptom', palpitations,   'cardio_af', 1.0)
        add_relation(c, afib,     'has_symptom', syncope,        'cardio_af', 0.5)
        add_relation(c, afib,     'suggests_test', ecg,          'cardio_af', 1.0)

        add_relation(c, hf,       'has_symptom', dyspnea,        'cardio_hf', 1.0)
        add_relation(c, hf,       'has_symptom', orthopnea,      'cardio_hf', 0.9)
        add_relation(c, hf,       'has_symptom', edema,          'cardio_hf', 0.8)
        add_relation(c, hf,       'associated_with_lab_pattern', bnp_up, 'cardio_hf', 0.9)
        add_relation(c, hf,       'suggests_test', tte,          'cardio_hf', 1.0)
        add_relation(c, hf,       'suggests_test', cxr,          'cardio_hf', 0.8)

        add_relation(c, as_vlv,   'has_symptom', syncope,        'cardio_as', 0.8)
        add_relation(c, as_vlv,   'has_symptom', dyspnea,        'cardio_as', 0.7)
        add_relation(c, as_vlv,   'suggests_test', tte,          'cardio_as', 1.0)

        add_relation(c, pericard, 'has_symptom', pleuritic_cp,   'cardio_pericard', 1.0)
        add_relation(c, pericard, 'suggests_test', ecg,          'cardio_pericard', 0.9)
        add_relation(c, pericard, 'suggests_test', tte,          'cardio_pericard', 0.8)

        # --- Relations: Neurology cluster ---
        add_relation(c, stroke,   'has_symptom', focal_weak,     'neuro_stroke', 1.0)
        add_relation(c, stroke,   'has_symptom', aphasia,        'neuro_stroke', 0.9)
        add_relation(c, stroke,   'has_symptom', visual_loss,    'neuro_stroke', 0.7)
        add_relation(c, stroke,   'suggests_test', ct_head,      'neuro_stroke', 1.0)
        add_relation(c, stroke,   'suggests_test', mri_brain,    'neuro_stroke', 0.9)

        add_relation(c, tia,      'has_symptom', focal_weak,     'neuro_tia', 0.8)
        add_relation(c, tia,      'has_symptom', aphasia,        'neuro_tia', 0.7)
        add_relation(c, tia,      'suggests_test', mri_brain,    'neuro_tia', 0.8)

        add_relation(c, seizure,  'has_symptom', convulsion,     'neuro_seizure', 1.0)
        add_relation(c, seizure,  'suggests_test', eeg_test,     'neuro_seizure', 1.0)

        add_relation(c, migraine, 'has_symptom', headache,       'neuro_migraine', 1.0)
        add_relation(c, migraine, 'has_symptom', aura_visual,    'neuro_migraine', 0.9)
        add_relation(c, migraine, 'suggests_test', ct_head,      'neuro_migraine', 0.4)

        add_relation(c, gbs,      'has_symptom', ascending_wk,   'neuro_gbs', 1.0)
        add_relation(c, gbs,      'has_symptom', areflexia,      'neuro_gbs', 0.9)
        add_relation(c, gbs,      'suggests_test', csf_analysis,  'neuro_gbs', 0.8)

        # --- Relations: Oncology cluster ---
        add_relation(c, lung_ca,  'has_symptom', dry_cough,      'onco_lung', 0.8)
        add_relation(c, lung_ca,  'has_symptom', hemoptysis,     'onco_lung', 0.8)
        add_relation(c, lung_ca,  'has_symptom', weight_loss,    'onco_lung', 0.7)
        add_relation(c, lung_ca,  'suggests_test', ct_chest,     'onco_lung', 1.0)
        add_relation(c, lung_ca,  'suggests_test', node_biopsy,  'onco_lung', 0.8)

        add_relation(c, lymphoma, 'has_symptom', lymph_nodes,    'onco_lymphoma', 1.0)
        add_relation(c, lymphoma, 'has_symptom', night_sweats,   'onco_lymphoma', 0.8)
        add_relation(c, lymphoma, 'has_symptom', weight_loss,    'onco_lymphoma', 0.7)
        add_relation(c, lymphoma, 'associated_with_lab_pattern', ldh_up, 'onco_lymphoma', 0.8)
        add_relation(c, lymphoma, 'suggests_test', node_biopsy,  'onco_lymphoma', 1.0)

        add_relation(c, aml,      'has_symptom', fatigue:=E(c, 'Fatigue', 'Symptom'), 'onco_aml', 0.8)
        add_relation(c, aml,      'associated_with_lab_pattern', anemia, 'onco_aml', 0.9)
        add_relation(c, aml,      'suggests_test', cbc_diff,     'onco_aml', 1.0)

        # --- Relations: Toxicology cluster ---
        add_relation(c, opioid_od,  'has_symptom', miosis,       'toxo_opioid', 1.0)
        add_relation(c, opioid_od,  'has_symptom', resp_depr,    'toxo_opioid', 1.0)
        add_relation(c, opioid_od,  'suggests_test', abg,        'toxo_opioid', 0.8)

        add_relation(c, organophos, 'has_symptom', miosis,       'toxo_op', 1.0)
        add_relation(c, organophos, 'has_symptom', salivation,   'toxo_op', 0.9)
        add_relation(c, organophos, 'has_symptom', bronchorrhea, 'toxo_op', 0.8)
        add_relation(c, organophos, 'suggests_test', cholinest,  'toxo_op', 1.0)

        add_relation(c, apap_tox,   'has_symptom', nausea,       'toxo_apap', 0.8)
        add_relation(c, apap_tox,   'has_symptom', ruq_pain,     'toxo_apap', 0.6)
        add_relation(c, apap_tox,   'associated_with_lab_pattern', transaminitis, 'toxo_apap', 0.9)
        add_relation(c, apap_tox,   'suggests_test', apap_level,  'toxo_apap', 1.0)

        # --- Overlaps & differentials (infection ↔ autoimmune bridges) ---
        for dz in [dengue, influenza, covid19, cap, tb, typhoid, uti, malaria, stills]:
            add_relation(c, dz, 'associated_with_lab_pattern', crp_esr_up, 'nonspecific_inflammation', 0.4)

        # Example differentials (bidirectional, moderate weight)
        diffs = [
            (dengue,  sle), (influenza, ra), (covid19,  ra), (cap, aav),
            (tb,     aav), (tb, sle), (uti, aav), (typhoid, ibd), (malaria, stills)
        ]
        for a,b in diffs:
            add_relation(c, a, 'differential_with', b, 'ddx_links', 0.5)
            add_relation(c, b, 'differential_with', a, 'ddx_links', 0.5)

        # Cross-domain differentials (examples)
        cross_diffs = [
            (cap, pericard),   # pleuritic chest pain: pneumonia vs pericarditis
            (acs, pericard),   # chest pain etiologies
            (stroke, migraine),
            (TIA:=tia, seizure),
            (lung_ca, tb),
            (opioid_od, stroke),
            (apap_tox, hepatitis:=E(c, 'Acute hepatitis', 'Disease')),
        ]
        for a, b in cross_diffs:
            add_relation(c, a, 'differential_with', b, 'ddx_links_cross', 0.4)
            add_relation(c, b, 'differential_with', a, 'ddx_links_cross', 0.4)

        # --- Simple test priors (toy values: sens, spec, LR+, LR-) ---
        add_test_prior(c, 'Dengue NS1/IgM serology', 0.85, 0.95, 12.0, 0.16)
        add_test_prior(c, 'Dengue RT-PCR',            0.90, 0.99, 90.0, 0.10)
        add_test_prior(c, 'Malaria smear/RDT',        0.95, 0.98, 47.5, 0.05)
        add_test_prior(c, 'Influenza RT-PCR',         0.95, 0.99, 95.0, 0.05)
        add_test_prior(c, 'SARS-CoV-2 PCR/Ag',        0.85, 0.98, 42.5, 0.15)
        add_test_prior(c, 'Sputum AFB smear/PCR',     0.70, 0.98, 35.0, 0.31)
        add_test_prior(c, 'TB IGRA/TST',              0.80, 0.75, 3.20, 0.27)
        add_test_prior(c, 'Blood culture',            0.70, 0.99, 70.0, 0.30)
        add_test_prior(c, 'Urine culture',            0.90, 0.99, 90.0, 0.10)
        add_test_prior(c, 'Chest X-ray',              0.70, 0.80, 3.50, 0.38)
        add_test_prior(c, 'CRP',                      0.75, 0.60, 1.88, 0.42)
        add_test_prior(c, 'ESR',                      0.70, 0.55, 1.56, 0.55)
        add_test_prior(c, 'ANA by IFA',               0.95, 0.85, 6.33, 0.06)
        add_test_prior(c, 'Anti-dsDNA',               0.70, 0.95, 14.0, 0.32)
        add_test_prior(c, 'Complement (C3/C4)',       0.65, 0.85, 4.33, 0.41)
        add_test_prior(c, 'Rheumatoid factor',        0.70, 0.80, 3.50, 0.38)
        add_test_prior(c, 'Anti-CCP',                 0.70, 0.95, 14.0, 0.32)
        add_test_prior(c, 'HLA-B27 typing',           0.50, 0.90, 5.00, 0.56)
        add_test_prior(c, 'ANCA (MPO/PR3)',           0.85, 0.95, 17.0, 0.16)
        add_test_prior(c, 'Urinalysis',               0.80, 0.70, 2.67, 0.29)
        add_test_prior(c, 'Ferritin',                 0.85, 0.70, 2.83, 0.21)
        add_test_prior(c, 'TSH',                      0.95, 0.95, 19.0, 0.05)
        add_test_prior(c, 'Anti-TPO antibodies',      0.90, 0.95, 18.0, 0.11)
        # Cardiology tests
        add_test_prior(c, '12-lead ECG',                 0.70, 0.80, 3.50, 0.38)
        add_test_prior(c, 'High-sensitivity troponin',   0.95, 0.90, 9.50, 0.06)
        add_test_prior(c, 'Transthoracic echocardiogram',0.85, 0.85, 5.67, 0.18)
        # Neurology tests
        add_test_prior(c, 'CT head (non-contrast)',      0.65, 0.95, 13.0, 0.37)
        add_test_prior(c, 'MRI brain',                   0.90, 0.95, 18.0, 0.11)
        add_test_prior(c, 'Electroencephalogram (EEG)',  0.80, 0.90, 8.00, 0.22)
        add_test_prior(c, 'CSF analysis',                0.75, 0.85, 5.00, 0.29)
        # Oncology tests
        add_test_prior(c, 'CBC with differential',       0.80, 0.80, 4.00, 0.25)
        add_test_prior(c, 'Lymph node excisional biopsy',0.98, 0.99, 98.0, 0.02)
        # Toxicology tests
        add_test_prior(c, 'Serum acetaminophen level',   0.99, 0.99, 99.0, 0.01)
        add_test_prior(c, 'Serum cholinesterase',        0.85, 0.90, 8.50, 0.17)
        add_test_prior(c, 'Arterial blood gas',          0.80, 0.85, 5.33, 0.24)

        c.commit()

    # Export/inspect
    G = to_networkx()
    print(f'KG nodes: {G.number_of_nodes()}, edges: {G.number_of_edges()}')
    # Tip: you can serialize for Gephi/Neo4j exploration:
    # import networkx as nx
    # nx.write_gexf(G, 'infection_autoimmune_kg.gexf')
