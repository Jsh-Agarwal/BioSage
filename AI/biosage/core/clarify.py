from typing import List
import os
from dotenv import load_dotenv
from ..core.schemas import ClarifyRequest, ClarifyResponse
from ..core.llm import reason

load_dotenv()
OPENAI_REAS_MODEL = os.getenv("OPENAI_REAS_MODEL", "gpt-4o")

SYSTEM_PROMPT = "You are a clinical elicitation assistant. Generate 1-3 targeted yes/no questions to clarify uncertainties in differential diagnosis."

async def generate_questions(req: ClarifyRequest) -> ClarifyResponse:
    uncertainties = req.top_uncertainties[:3]  # top 3
    symptoms = req.normalized_intake.symptoms_normalized
    prompt = f"""
Current symptoms: {', '.join(symptoms)}
Top uncertainties: {', '.join(uncertainties)}

Generate 1-3 yes/no questions to disambiguate these diagnoses. Focus on key symptoms, exposures, or labs not yet mentioned.
Output as JSON: {{"questions": ["Question 1?", "Question 2?"]}}
"""
    try:
        data = reason(
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            model=OPENAI_REAS_MODEL,
            temperature=0.3,
            response_format={"type": "json_object"},
        )
        parsed = eval(data)  # simple for MVP
        questions = parsed.get("questions", [])[:3]
        return ClarifyResponse(questions=questions)
    except Exception:
        return ClarifyResponse(questions=["Do you have any additional symptoms?"])
