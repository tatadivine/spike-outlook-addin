"""
Exclusion engine.

Prevents known false positives from ever reaching a performance metric.
Rules are configurable (see app/services/settings_service.py, which backs
/settings/exclusions) and are applied BEFORE scoring, never after — a
message that matches an enabled exclusion rule is removed from the SLA
population entirely rather than being scored and then forgiven.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass
class ExclusionResult:
    excluded: bool
    reason: str | None = None
    rule_id: str | None = None


# Each checker receives a communication-shaped dict and either returns a
# reason string (excluded) or None (not excluded by this rule).
def _check_automated_sender(comm: dict) -> str | None:
    sender = (comm.get("contact") or "").lower()
    if "noreply" in sender or "no-reply" in sender or "system" in sender:
        return "Automated / system-generated sender."
    return None


def _check_newsletter(comm: dict) -> str | None:
    subject = (comm.get("subject") or "").lower()
    if "newsletter" in subject or "digest" in subject:
        return "Newsletter or bulk informational content."
    return None


def _check_fyi(comm: dict) -> str | None:
    subject = (comm.get("subject") or "").lower()
    body = (comm.get("body_preview") or "").lower()
    if subject.startswith("fyi") or "for your information" in body:
        return "Marked FYI — no response reasonably expected."
    return None


def _check_approved_pto(comm: dict) -> str | None:
    if comm.get("excluded") and comm.get("exclusion_reason") and "PTO" in comm["exclusion_reason"]:
        return comm["exclusion_reason"]
    return None


_RULE_CHECKERS = {
    "automated_messages": _check_automated_sender,
    "newsletters": _check_newsletter,
    "fyi_messages": _check_fyi,
    "approved_pto": _check_approved_pto,
}


def evaluate(comm: dict, enabled_rule_ids: set[str] | None = None) -> ExclusionResult:
    """Run all enabled exclusion rules against a communication. The first
    matching rule wins (rules are intentionally independent, not stacked)."""
    enabled = enabled_rule_ids if enabled_rule_ids is not None else set(_RULE_CHECKERS.keys())
    for rule_id, checker in _RULE_CHECKERS.items():
        if rule_id not in enabled:
            continue
        reason = checker(comm)
        if reason:
            return ExclusionResult(excluded=True, reason=reason, rule_id=rule_id)
    return ExclusionResult(excluded=False)
