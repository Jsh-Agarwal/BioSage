import os
import json
from typing import List, Dict
from dotenv import load_dotenv

from .llm import reason
from .prompts import RECOMMENDATIONS_SYSTEM_PROMPT, build_recommendations_user_prompt
from .schemas import Recommendation, FusedOutput

load_dotenv()
OPENAI_REAS_MODEL = os.getenv("OPENAI_REAS_MODEL", "gpt-4o")


def _summarize_fused(fused: FusedOutput) -> str:
    lines: List[str] = []
    for i, d in enumerate(fused.differential[:5], start=1):
        lines.append(f"{i}. {d.diagnosis} (score={d.score_global}) — {d.why_top}")
    lines.append(f"Next best test: {fused.next_best_test.name} — {fused.next_best_test.why}")
    return "\n".join(lines)


def generate_recommendations(context: Dict, fused: FusedOutput) -> List[Recommendation]:
    summary = _summarize_fused(fused)
    prompt = build_recommendations_user_prompt(context, summary)
    try:
        content = reason(
            messages=[
                {"role": "system", "content": RECOMMENDATIONS_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            model=OPENAI_REAS_MODEL,
            temperature=0.2,
            response_format={"type": "json_object"},
        )
        data = json.loads(content)
        items = []
        for item in data.get("recommendations", [])[:6]:
            title = str(item.get("title", "Recommendation"))
            rationale = str(item.get("rationale", ""))
            priority = str(item.get("priority", "medium"))
            items.append(Recommendation(title=title, rationale=rationale, priority=priority))
        return items
    except Exception:
        return [
            Recommendation(title=fused.next_best_test.name, rationale=fused.next_best_test.why, priority="high")
        ]


