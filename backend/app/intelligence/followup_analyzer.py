"""Determines whether an open thread is overdue for a follow-up, given a
configurable cadence. Real logic, not a placeholder — used by
followup_service to flag threads with no scheduled next touch."""
from __future__ import annotations

from datetime import datetime, timezone

DEFAULT_CADENCE_DAYS = 5


def is_overdue_for_followup(last_activity_iso: str, cadence_days: int = DEFAULT_CADENCE_DAYS) -> bool:
    last = datetime.fromisoformat(last_activity_iso)
    if last.tzinfo is None:
        last = last.replace(tzinfo=timezone.utc)
    days_since = (datetime.now(timezone.utc) - last).days
    return days_since >= cadence_days
