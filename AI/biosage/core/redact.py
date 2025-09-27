import re
from typing import Dict, Any

def redact_phi(text: str) -> str:
    """Redact PHI from text before sending to external LLMs."""
    # Remove names (common patterns)
    text = re.sub(r'\b[A-Z][a-z]+\s+[A-Z][a-z]+\b', '[REDACTED NAME]', text)
    # Remove addresses (simple patterns)
    text = re.sub(r'\b\d+\s+[A-Za-z]+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Place|Pl|Court|Ct)\b', '[REDACTED ADDRESS]', text)
    # Remove phone numbers
    text = re.sub(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', '[REDACTED PHONE]', text)
    # Remove emails
    text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[REDACTED EMAIL]', text)
    # Remove SSNs
    text = re.sub(r'\b\d{3}[-]?\d{2}[-]?\d{4}\b', '[REDACTED SSN]', text)
    return text

def redact_intake(intake: Dict[str, Any]) -> Dict[str, Any]:
    """Redact PHI from intake data."""
    redacted = intake.copy()
    # Redact demographics if they contain names
    if 'demographics' in redacted:
        demo = redacted['demographics']
        if 'name' in demo:
            demo['name'] = '[REDACTED]'
        if 'address' in demo:
            demo['address'] = '[REDACTED]'
    return redacted
