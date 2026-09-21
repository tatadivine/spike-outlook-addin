"""
Scoring engine.

Computes an explainable Response Score from a population of (already
exclusion-filtered) communications. Every component is a plain,
documented formula — nothing here is an opaque model, consistent with
"AI findings must not automatically become final negative performance
findings" and "every score should be explainable".
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass
class ScoreBreakdown:
    response_performance: float
    ownership: float
    follow_through: float
    commitment_completion: float
    communication_quality: float
    final_score: int


# Configurable weights — mirrors what /settings/scoring exposes.
DEFAULT_WEIGHTS = {
    "response_performance": 0.35,
    "ownership": 0.15,
    "follow_through": 0.2,
    "commitment_completion": 0.15,
    "communication_quality": 0.15,
}


def _pct(numerator: int, denominator: int) -> float:
    return (numerator / denominator * 100) if denominator else 100.0


def compute_response_score(
    communications: list[dict],
    commitments: list[dict],
    weights: dict[str, float] | None = None,
) -> ScoreBreakdown:
    w = weights or DEFAULT_WEIGHTS
    scored = [c for c in communications if not c.get("excluded")]

    on_time = sum(
        1 for c in scored
        if c.get("response_time_minutes") is not None
        and c["response_time_minutes"] <= (24 * 60 if c["category"] == "customer" else 48 * 60)
    )
    responded = sum(1 for c in scored if c.get("response_time_minutes") is not None)
    response_performance = _pct(on_time, responded) if responded else 80.0

    owned = sum(1 for c in scored if c.get("ai_finding") and c["ai_finding"].get("ownership") == "Employee")
    ownership = _pct(owned, len(scored)) if scored else 90.0

    completed_commitments = sum(1 for c in commitments if c["status"] == "completed")
    follow_through = _pct(completed_commitments, len(commitments)) if commitments else 90.0

    on_time_commitments = sum(
        1 for c in commitments if c["status"] == "completed" and c["days_overdue"] == 0
    )
    commitment_completion = _pct(on_time_commitments, max(completed_commitments, 1))

    quality_scores = [c["quality_score"] for c in scored if c.get("quality_score") is not None]
    communication_quality = sum(quality_scores) / len(quality_scores) if quality_scores else 85.0

    final = (
        response_performance * w["response_performance"]
        + ownership * w["ownership"]
        + follow_through * w["follow_through"]
        + commitment_completion * w["commitment_completion"]
        + communication_quality * w["communication_quality"]
    )

    return ScoreBreakdown(
        response_performance=round(response_performance, 1),
        ownership=round(ownership, 1),
        follow_through=round(follow_through, 1),
        commitment_completion=round(commitment_completion, 1),
        communication_quality=round(communication_quality, 1),
        final_score=round(final),
    )
