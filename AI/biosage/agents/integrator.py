from typing import List, Dict
from ..core.schemas import AgentResult, FusedOutput, DifferentialItem, NextBestTest, Citation, TestPlanItem
from ..core.kg import to_networkx, suggest_next_best_test
import numpy as np
from scipy.spatial.distance import jensenshannon


def integrate(results: List[AgentResult], ctx: Dict) -> FusedOutput:
    seen = {}
    for r in results:
        for c in getattr(r, 'candidates', []) or []:
            key = c.diagnosis.strip().lower()
            if not key:
                continue
            if key not in seen:
                seen[key] = {"name": c.diagnosis, "scores": [], "paths": [], "why": [], "cites": []}
            seen[key]["scores"].append(c.score_local or 0.5)
            seen[key]["paths"].extend(c.graph_paths)
            seen[key]["why"].append(c.rationale)
            seen[key]["cites"].extend(c.citations)
    diffs: List[DifferentialItem] = []
    for _, v in seen.items():
        score = sum(v["scores"]) / max(1, len(v["scores"]))
        why = "; ".join(v["why"])[:240]
        diffs.append(DifferentialItem(
            diagnosis=v["name"],
            score_global=float(round(score, 3)),
            why_top=why,
            citations=[Citation(doc_id=c.doc_id, span=c.span) for c in v["cites"]],
            graph_paths=v["paths"]
        ))
    diffs = sorted(diffs, key=lambda x: x.score_global, reverse=True)[:5]

    # Compute disagreement: JS divergence over distributions (robust to empty/degenerate)
    agent_distributions = []
    for r in results:
        dist = {}
        for c in getattr(r, 'candidates', []) or []:
            key = c.diagnosis.strip().lower()
            dist[key] = c.score_local or 0.5
        # Normalize to prob dist
        total = sum(dist.values())
        if total > 0:
            dist = {k: v / total for k, v in dist.items()}
        agent_distributions.append(dist)
    
    if len(agent_distributions) >= 2:
        # Pairwise JS, average
        js_scores = []
        for i in range(len(agent_distributions)):
            for j in range(i+1, len(agent_distributions)):
                keys = set(agent_distributions[i].keys()) | set(agent_distributions[j].keys())
                if not keys:
                    continue
                p = [agent_distributions[i].get(k, 0.0) for k in keys]
                q = [agent_distributions[j].get(k, 0.0) for k in keys]
                sp, sq = sum(p), sum(q)
                # If either distribution is degenerate (sum==0), fallback to uniform
                if sp == 0.0:
                    p = [1.0 / len(keys)] * len(keys)
                if sq == 0.0:
                    q = [1.0 / len(keys)] * len(keys)
                try:
                    d = float(jensenshannon(p, q) ** 2)
                except Exception:
                    d = 0.0
                if not np.isfinite(d):
                    d = 0.0
                # clamp to [0,1]
                d = max(0.0, min(1.0, d))
                js_scores.append(d)
        disagreement = float(np.mean(js_scores)) if js_scores else 0.0
    else:
        disagreement = 0.0

    G = to_networkx()
    hyp_names = [d.diagnosis for d in diffs]
    best, why, edges, linked = suggest_next_best_test(G, hyp_names, ctx.get('norm', {}).get('symptoms_normalized', []))
    nbt = NextBestTest(name=best, why=why, linked_hypotheses=linked, graph_edges=edges)
    
    # Generate test plans for top 3
    test_plans: List[TestPlanItem] = []
    for d in diffs[:3]:
        # Simple plan: if next_best_test positive, favor this; else, suggest another
        plan = f"If {nbt.name} positive → favor {d.diagnosis}; if negative → order clinical re-evaluation."
        test_plans.append(TestPlanItem(diagnosis=d.diagnosis, plan=plan))
    
    # Ensure disagreement is JSON-safe
    if not np.isfinite(disagreement):
        disagreement = 0.0
    disagreement = float(max(0.0, min(1.0, disagreement)))
    return FusedOutput(differential=diffs, next_best_test=nbt, disagreement_score=disagreement, test_plans=test_plans)
