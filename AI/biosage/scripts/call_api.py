import argparse
import json
from typing import Any, Dict, List, Optional
from urllib import request, error


def build_sample_payload(mrn: str = "P123") -> Dict[str, Any]:
    """Return a minimal but representative PatientData payload."""
    return {
        "patient": {
            "mrn": mrn,
            "gender": "female",
            "dob": "1990-04-03",
        },
        "case": {
            # Cross-domain symptoms to engage all specialist agents (infectious, autoimmune, cardiology, neurology, oncology, toxicology)
            "chief_complaint": "heavy weight loss, frequent urination and thurst, dizziness"
        },
        "vitals": {
            "temperature": "38.5",
            "bp": "120/80",
            "o2sat": "98"
        },
        "labs": [],
        "medical_history": {
            "conditions": []
        },
        "social_history": {
            # Strings required by API schema (PatientSocialHistory expects str)
            "travel": "",
            "exposure": "Desc Job, No moment"
        }
    }


def http_post_json(url: str, payload: Dict[str, Any], timeout_s: float = 30.0) -> Dict[str, Any]:
    """POST JSON and return parsed JSON response using stdlib only."""
    data = json.dumps(payload).encode("utf-8")
    req = request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with request.urlopen(req, timeout=timeout_s) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body or "{}")
    except error.HTTPError as e:
        try:
            detail = e.read().decode("utf-8")
        except Exception:
            detail = str(e)
        raise RuntimeError(f"HTTP {e.code}: {detail}")
    except error.URLError as e:
        raise RuntimeError(f"Connection error: {e}")


def print_formatted_result(result: Dict[str, Any]) -> None:
    """Pretty-print a concise, readable summary from DiagnoseResult."""
    print("\n=== DiagnoseResult (summary) ===")
    agents: List[Dict[str, Any]] = result.get("agents", []) or []
    for agent in agents:
        name = agent.get("agent", "?")
        cands = agent.get("candidates", []) or []
        top_items = []
        for c in cands[:3]:
            dx = str(c.get("diagnosis", "")).strip()
            sc = c.get("score_local")
            if isinstance(sc, (int, float)):
                top_items.append(f"{dx} ({sc:.2f})")
            else:
                top_items.append(dx)
        print(f"- Agent: {name} | Top: {', '.join([t for t in top_items if t]) or 'n/a'}")

    fused = result.get("fused", {}) or {}
    diff = fused.get("differential", []) or []
    if diff:
        print("\nTop differential:")
        for item in diff[:5]:
            dx = item.get("diagnosis", "?")
            score = item.get("score_global")
            why = (item.get("why_top") or "").strip()
            why_short = (why[:100] + "…") if len(why) > 100 else why
            if isinstance(score, (int, float)):
                print(f"  - {dx} (score={score:.2f}) :: {why_short}")
            else:
                print(f"  - {dx} (score=n/a) :: {why_short}")

    nbt = fused.get("next_best_test", {}) or {}
    if nbt:
        print("\nNext best test:")
        print(f"  - Name: {nbt.get('name', 'n/a')}")
        print(f"  - Why: {(nbt.get('why') or '').strip()}")
        linked = nbt.get("linked_hypotheses", []) or []
        if linked:
            print(f"  - Linked hypotheses: {', '.join(linked)}")

    recs = result.get("recommendations", []) or []
    if recs:
        print("\nRecommendations:")
        for r in recs[:6]:
            print(f"  - {r.get('title','')}: {r.get('rationale','')} (priority={r.get('priority','')})")

    print("\n=== Raw JSON (pretty) ===")
    print(json.dumps(result, indent=2, ensure_ascii=False))


def main() -> None:
    parser = argparse.ArgumentParser(description="Call BioSage /diagnose and pretty-print the result.")
    parser.add_argument("--base-url", default="http://localhost:8009", help="Base URL of the API, e.g., http://localhost:8009")
    parser.add_argument("--mrn", default="P123", help="Patient MRN to use in sample payload")
    parser.add_argument("--payload", default=None, help="Path to JSON file with custom PatientData payload")
    parser.add_argument("--timeout", type=float, default=200, help="HTTP timeout in seconds (default 60)")
    args = parser.parse_args()

    if args.payload:
        with open(args.payload, "r", encoding="utf-8") as f:
            payload = json.load(f)
    else:
        payload = build_sample_payload(mrn=args.mrn)

    url = args.base_url.rstrip("/") + "/diagnose"
    print(f"Posting to {url} ...")
    result = http_post_json(url, payload, timeout_s=args.timeout)
    print_formatted_result(result)


if __name__ == "__main__":
    main()


