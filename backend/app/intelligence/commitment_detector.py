"""Lightweight rule-based commitment detection. In AI_PROVIDER=real mode
this would call an LLM/NLP model; in mock mode it looks for common
promise-language patterns. Always returns a confidence and reasoning
string so the finding can be labeled AI-assisted and reviewed."""
from __future__ import annotations

_COMMITMENT_PHRASES = [
    "will send", "will follow up", "will provide", "by end of", "i'll get you",
    "we will deliver", "next steps", "i will confirm", "will update you",
]


def detect(body_text: str) -> tuple[bool, int, str]:
    text = body_text.lower()
    hits = [p for p in _COMMITMENT_PHRASES if p in text]
    if not hits:
        return False, 60, "No commitment language detected."
    confidence = min(97, 70 + len(hits) * 8)
    return True, confidence, f"Matched commitment language: {', '.join(hits[:2])}."
