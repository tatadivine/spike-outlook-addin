from __future__ import annotations

from app.mock import generator as gen
from app.mock.pools import DEPARTMENTS


def organization_overview() -> dict:
    return {
        "org_aggregate": gen.org_aggregate,
        "departments": [gen.department_aggregate(d) for d in DEPARTMENTS],
    }


def department_breakdown() -> list[dict]:
    return [gen.department_aggregate(d) for d in DEPARTMENTS]


def organization_trends() -> dict:
    # A simple 4-point trend built off the current org aggregate — real
    # implementation would read historical snapshots from Postgres.
    base = gen.org_aggregate["response_score"]
    weeks = ["Week 1", "Week 2", "Week 3", "Week 4"]
    return {"trend": [{"label": w, "value": max(60, base - (3 - i) * 2)} for i, w in enumerate(weeks)]}
