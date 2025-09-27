import csv
import os
from typing import List, Tuple, Dict
from .terminology import get_codes

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'terminology')
MAP_FILE = os.path.join(DATA_DIR, 'symptom_map.csv')

# simple normalization with lookup; fuzzy optional later

def load_map() -> Dict[str, Tuple[str, str]]:
    mapping: Dict[str, Tuple[str, str]] = {}
    if os.path.exists(MAP_FILE):
        with open(MAP_FILE, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                k = row['term'].strip().lower()
                mapping[k] = (row['canonical'], row.get('code', ''))
    return mapping

SYMPTOM_MAP = load_map()

def normalize_symptoms(text: str) -> Tuple[List[str], Dict[str, str]]:
    tokens = [t.strip().lower() for t in text.replace(';', ',').split(',') if t.strip()]
    norm: List[str] = []
    codes: Dict[str, str] = {}
    for t in tokens:
        if t in SYMPTOM_MAP:
            can, code = SYMPTOM_MAP[t]
            norm.append(can)
            if code:
                codes[can] = code
        else:
            norm.append(t)
            # Try ontology codes
            snomed, icd, umls = get_codes(t)
            if snomed:
                codes[t] = f"SNOMED:{snomed}"
            elif icd:
                codes[t] = f"ICD:{icd}"
            elif umls:
                codes[t] = f"UMLS:{umls}"
    # de-dup preserve order
    seen = set()
    uniq = []
    for s in norm:
        if s not in seen:
            seen.add(s)
            uniq.append(s)
    return uniq, codes
