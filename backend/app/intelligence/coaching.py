"""Turns raw performance signals into coaching-framed language — the
product principle that SpikeOS is not punitive. Never emits a bare
negative statement without a constructive framing."""
from __future__ import annotations


def frame_strength(metric_label: str, value: str) -> dict[str, str]:
    return {"title": metric_label, "desc": value}


def frame_coaching_opportunity(overdue_count: int) -> dict[str, str]:
    if overdue_count <= 0:
        return {"title": "No overdue follow-ups", "desc": "Keep up the current follow-up cadence."}
    return {
        "title": f"{overdue_count} overdue follow-up{'s' if overdue_count != 1 else ''}",
        "desc": "Require attention — see Follow-ups for the full list.",
    }
