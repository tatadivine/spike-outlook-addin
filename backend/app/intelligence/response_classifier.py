"""Classifies whether a communication reasonably requires a response at
all — the first gate before anything is scored. Complements exclusions.py
(which removes known-noise categories); this handles ambiguous content."""
from __future__ import annotations

_NO_RESPONSE_PHRASES = ["no reply needed", "fyi only", "just looping you in"]


def requires_response(body_text: str) -> bool:
    text = body_text.lower()
    return not any(p in text for p in _NO_RESPONSE_PHRASES)
