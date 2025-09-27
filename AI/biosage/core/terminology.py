import os
from typing import Dict, Tuple

# Curated maps for SNOMED/ICD/UMLS (subset for MVP)
SNOMED_MAP: Dict[str, str] = {
    'fever': '386661006',
    'chills': '43724002',
    'myalgia': '68962001',
    'headache': '25064002',
    'rash-malar': '40275004',
    'thrombocytopenia': '302215000',
    'anaemia': '271737000',
}

ICD_MAP: Dict[str, str] = {
    'fever': 'R50.9',
    'chills': 'R68.83',
    'myalgia': 'M79.7',
    'headache': 'R51',
    'rash-malar': 'L53.9',
    'thrombocytopenia': 'D69.6',
    'anaemia': 'D64.9',
}

UMLS_MAP: Dict[str, str] = {
    'fever': 'C0015967',
    'chills': 'C0085593',
    'myalgia': 'C0231528',
    'headache': 'C0018681',
    'rash-malar': 'C0263401',
    'thrombocytopenia': 'C0040034',
    'anaemia': 'C0002871',
}

def get_codes(term: str) -> Tuple[str, str, str]:
    """Return (SNOMED, ICD, UMLS) codes for term."""
    return (
        SNOMED_MAP.get(term.lower(), ''),
        ICD_MAP.get(term.lower(), ''),
        UMLS_MAP.get(term.lower(), ''),
    )
