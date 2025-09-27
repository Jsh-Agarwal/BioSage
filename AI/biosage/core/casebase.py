import os
import sqlite3
from typing import List, Dict, Any
import json

from .llm import embed_texts

ROOT = os.path.dirname(os.path.dirname(__file__))
DB_PATH = os.path.join(ROOT, 'storage', 'app.db')


def _fetch_all_cases() -> List[Dict[str, Any]]:
    if not os.path.exists(DB_PATH):
        return []
    con = sqlite3.connect(DB_PATH)
    try:
        cur = con.cursor()
        rows = cur.execute('SELECT id, intake, normalized FROM cases ORDER BY created_at DESC LIMIT 500').fetchall()
        out = []
        for row in rows:
            case_id = row[0]
            intake = {}
            normalized = {}
            try:
                intake = json.loads(row[1] or '{}')
            except Exception:
                intake = {}
            try:
                normalized = json.loads(row[2] or '{}')
            except Exception:
                normalized = {}
            out.append({'case_id': case_id, 'intake': intake, 'normalized': normalized})
        return out
    finally:
        con.close()


def _summarize_case(case: Dict[str, Any]) -> str:
    norm = case.get('normalized', {})
    intake = norm.get('intake', case.get('intake', {}))
    symptoms = norm.get('symptoms_normalized') or []
    labs = intake.get('initial_labs', {})
    demo = intake.get('demographics', {})
    vitals = intake.get('vitals', {})
    return (
        f"Demographics: {demo}\n"
        f"Vitals: {vitals}\n"
        f"Symptoms: {symptoms}\n"
        f"Labs: {labs}"
    )


def search_previous_cases(query_symptoms: List[str], k: int = 5) -> List[Dict[str, Any]]:
    """
    Retrieve top-k similar previous cases using embedding similarity over a textual summary.
    Returns list of {doc_id, text, score} where doc_id is prefixed with 'case:'.
    """
    all_cases = _fetch_all_cases()
    if not all_cases:
        return []
    # Build texts
    texts = [_summarize_case(c) for c in all_cases]
    # Embed corpus and query
    corpus_vecs = embed_texts(texts)
    query_text = ', '.join(query_symptoms) if query_symptoms else 'fever'
    query_vec = embed_texts([query_text])[0]

    # cosine similarity
    import numpy as np
    def cosine(a, b):
        a = np.array(a, dtype='float32')
        b = np.array(b, dtype='float32')
        denom = (np.linalg.norm(a) * np.linalg.norm(b)) or 1.0
        return float(np.dot(a, b) / denom)

    scored = []
    for case, vec in zip(all_cases, corpus_vecs):
        scored.append({
            'doc_id': f"case:{case['case_id']}",
            'text': _summarize_case(case),
            'score': cosine(query_vec, vec)
        })
    scored.sort(key=lambda x: x['score'], reverse=True)
    return scored[:k]


def format_case_snippets(passages: List[Dict[str, Any]]) -> str:
    out = []
    for p in passages:
        doc_id = p.get('doc_id', '')
        text = p.get('text', '')
        out.append(f"- {doc_id}: {text[:350]}")
    return "\n".join(out)


