"""Communication quality scoring — clarity, respect, ownership, and
actionable-next-steps sub-scores. Mock mode derives these from simple
heuristics over the message text; real mode would call an AI provider."""
from __future__ import annotations

_RESPECT_FLAGS = ["asap", "unacceptable", "again??", "!!!"]
_ACTION_PHRASES = ["next step", "will send", "please confirm", "by "]


def score(body_text: str, base_quality: int) -> dict[str, int]:
    text = body_text.lower()
    clarity = min(99, base_quality + (5 if len(body_text) < 400 else -5))
    respect = max(40, base_quality - 15 * sum(1 for f in _RESPECT_FLAGS if f in text))
    ownership = base_quality
    actionable = min(99, base_quality + (6 if any(p in text for p in _ACTION_PHRASES) else -12))
    return {
        "clarity": clarity,
        "respect": respect,
        "ownership": ownership,
        "actionable_next_steps": actionable,
    }
