from typing import Dict, List
import os
import json
from dotenv import load_dotenv
from ..core.schemas import AgentResult, Candidate, Citation
from ..core.vectorstore import search_hybrid as vs_search
from ..core.kg import to_networkx
from ..core.llm import reason
from ..core.prompts import ONCOLOGY_SYSTEM_PROMPT, AGENT_JSON_SCHEMA_DESC, build_agent_user_prompt
from ..core.casebase import search_previous_cases, format_case_snippets

load_dotenv()
OPENAI_REAS_MODEL = os.getenv("OPENAI_REAS_MODEL", "gpt-4o")


def _build_context(ctx: Dict) -> Dict:
    norm = ctx.get("norm", {})
    return {
        "demographics": norm.get("intake", {}).get("demographics", {}),
        "vitals": norm.get("intake", {}).get("vitals", {}),
        "symptoms_normalized": norm.get("symptoms_normalized", []),
        "duration_days": norm.get("intake", {}).get("duration_days"),
        "initial_labs": norm.get("intake", {}).get("initial_labs", {}),
        "exposures": norm.get("intake", {}).get("exposures", []),
        "travel": norm.get("intake", {}).get("travel", []),
    }


def _retrieve_docs(symptoms: List[str]) -> List[Dict]:
    try:
        query = ", ".join(symptoms) or "weight loss"
        return vs_search(query, k_dense=10, k_sparse=10, k_final=12)
    except Exception:
        return []


def _kg_snippets(symptoms: List[str]) -> str:
    try:
        G = to_networkx()
    except Exception:
        return ""
    lines: List[str] = []
    for s in symptoms[:5]:
        connected = set()
        for n, d in G.nodes(data=True):
            if d.get("name") == s:
                for _, v, edata in G.out_edges(n, data=True):
                    connected.add(f"{s} -[{edata.get('rel','rel')}]-> {G.nodes[v].get('name')}")
                for u, _, edata in G.in_edges(n, data=True):
                    connected.add(f"{G.nodes[u].get('name')} -[{edata.get('rel','rel')}]-> {s}")
        for c in list(connected)[:5]:
            lines.append(c)
    return "\n".join(lines[:20])


def _format_doc_snippets(passages: List[Dict]) -> str:
    out = []
    for p in passages[:8]:
        out.append(f"- {p.get('doc_id')}: {p.get('text','')[:350]}")
    return "\n".join(out)


async def run_agent(ctx: Dict) -> AgentResult:
    c = _build_context(ctx)
    symptoms = c.get("symptoms_normalized", [])
    passages = _retrieve_docs(symptoms)
    doc_snips = _format_doc_snippets(passages)
    prev_cases = search_previous_cases(symptoms, k=5)
    case_snips = format_case_snippets(prev_cases)
    kg_snips = _kg_snippets(symptoms)

    user_prompt = build_agent_user_prompt(
        domain="Oncology",
        context=c,
        doc_snips=doc_snips,
        kg_snips=kg_snips,
        case_snips=case_snips,
        k_docs=min(8, len(passages)),
        k_cases=min(5, len(prev_cases)),
    )

    try:
        content = reason(
            messages=[
                {"role": "system", "content": ONCOLOGY_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            model=OPENAI_REAS_MODEL,
            temperature=0.2,
            response_format={"type": "json_object"},
        )
        data = json.loads(content)
        cand_list = []
        candidates_in = data.get("candidates", [])[:6]
        for idx, item in enumerate(candidates_in):
            citations = [Citation(doc_id=str(c.get("doc_id","")), span=str(c.get("span",""))) for c in item.get("citations", [])]
            conf_str = str(item.get("confidence_qual", "low")).lower()
            conf_map = {"low": 0.55, "medium": 0.7, "high": 0.85}
            conf_w = conf_map.get(conf_str, 0.55)
            rank_w = max(0.4, 1.0 - 0.1 * float(idx))
            score_local = max(0.0, min(1.0, round(0.5 * conf_w + 0.5 * rank_w, 3)))
            cand_list.append(
                Candidate(
                    diagnosis=str(item.get("diagnosis","")),
                    rationale=str(item.get("rationale","")),
                    citations=citations,
                    graph_paths=item.get("graph_paths", []),
                    confidence_qual=str(item.get("confidence_qual", "low")),
                    score_local=score_local,
                )
            )
        for cand in cand_list:
            if not cand.citations:
                cand.citations = [Citation(doc_id='default', span='default')]
            if not cand.graph_paths:
                cand.graph_paths = [['default', 'path']]
        if not cand_list:
            raise ValueError("Empty candidates")
        return AgentResult(agent="oncology", candidates=cand_list)
    except Exception:
        return AgentResult(agent="oncology", candidates=[])


