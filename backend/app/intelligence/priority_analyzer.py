"""Infers a priority tier from communication metadata when one has not
been explicitly assigned. Mock/rule-based; swappable for a real model."""
from __future__ import annotations

_URGENT_WORDS = ["urgent", "asap", "immediately", "outage", "down"]


def infer_priority(subject: str, category: str) -> str:
    text = subject.lower()
    if any(w in text for w in _URGENT_WORDS):
        return "critical"
    if category == "customer":
        return "high"
    return "normal"
