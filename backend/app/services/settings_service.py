"""Backs /settings/*. Scoring rules and exclusion rules live here as an
in-memory, server-side configuration store — this is what
app/intelligence/scoring.py and exclusions.py would read weights/enabled
rules from in a fuller implementation. Every mutation is audited."""
from __future__ import annotations

from app.core.errors import not_found
from app.services import audit_service, permissions_service

_scoring_rules: list[dict] = [
    {"id": "r1", "label": "Customer response target", "value": "24 hours"},
    {"id": "r2", "label": "Internal response target", "value": "48 hours"},
    {"id": "r3", "label": "High priority target", "value": "4 hours"},
    {"id": "r4", "label": "Commitment follow-up", "value": "Required"},
]

_exclusion_rules: list[dict] = [
    {"id": "e1", "label": "Automated messages", "description": "System-generated notifications with no expected reply.", "rule": "Sender domain matches known automation systems.", "enabled": True},
    {"id": "e2", "label": "Newsletters", "description": "Bulk marketing or informational sends.", "rule": "Message contains unsubscribe/list-header metadata.", "enabled": True},
    {"id": "e3", "label": "Distribution lists", "description": "Messages sent to broad internal groups.", "rule": "Recipient is a distribution list, not an individual.", "enabled": True},
    {"id": "e4", "label": "FYI messages", "description": "Messages explicitly marked informational only.", "rule": "Subject or body indicates no response is required.", "enabled": True},
    {"id": "e5", "label": "Approved PTO", "description": "Time when the employee was on approved leave.", "rule": "Message received during an approved PTO window.", "enabled": True},
    {"id": "e6", "label": "Delegated coverage", "description": "Time when another employee covered communications.", "rule": "Delegate acknowledged on the employee's behalf.", "enabled": True},
    {"id": "e7", "label": "System-generated messages", "description": "Messages originating from internal tooling.", "rule": "Sender is a recognized system account.", "enabled": True},
    {"id": "e8", "label": "Not reasonably requiring a response", "description": "Content that does not require action.", "rule": "AI classification confidence exceeds threshold, subject to review.", "enabled": False},
]

_integrations: list[dict] = [
    {"name": "Microsoft 365", "status": "mock_mode", "description": "Source of communication and calendar records."},
    {"name": "Microsoft Graph", "status": "not_configured", "description": "Secure, permissioned access to Microsoft 365 data."},
    {"name": "Microsoft Entra ID", "status": "not_configured", "description": "Future authentication provider."},
    {"name": "Power BI", "status": "mock_mode", "description": "Powers embedded analytics inside SpikeOS."},
    {"name": "AI Provider", "status": "mock_mode", "description": "Communication quality and coaching intelligence."},
]


def list_scoring_rules() -> list[dict]:
    return _scoring_rules


def update_scoring_rule(rule_id: str, value: str, actor: str) -> dict:
    rule = next((r for r in _scoring_rules if r["id"] == rule_id), None)
    if not rule:
        raise not_found("scoring_rule")
    rule["value"] = value
    audit_service.log(actor, "Changed scoring rule", f"Settings / Scoring \u2014 {rule['label']}")
    return rule


# Maps the human-facing labels above to the rule_id keys
# app/intelligence/exclusions.py actually knows how to evaluate. Only rules
# with a real checker are bridged; the rest (distribution lists, delegated
# coverage, system-generated messages) are configurable here but not yet
# automatically evaluated anywhere — see exclusions.py's module docstring.
_LABEL_TO_EVALUATED_RULE_ID = {
    "Automated messages": "automated_messages",
    "Newsletters": "newsletters",
    "FYI messages": "fyi_messages",
    "Approved PTO": "approved_pto",
}


def enabled_evaluated_exclusion_rule_ids() -> set[str]:
    """The subset of enabled exclusion rules that `intelligence/exclusions.py`
    can actually check against a message. Used by outlook_service so the
    add-in's live/mock classification respects what an administrator has
    configured in Settings → Exclusions, instead of a hardcoded rule set."""
    return {
        _LABEL_TO_EVALUATED_RULE_ID[rule["label"]]
        for rule in _exclusion_rules
        if rule.get("enabled") and rule["label"] in _LABEL_TO_EVALUATED_RULE_ID
    }


def list_exclusion_rules() -> list[dict]:
    return _exclusion_rules


def set_exclusion_rule(rule_id: str, enabled: bool, actor: str) -> dict:
    rule = next((r for r in _exclusion_rules if r["id"] == rule_id), None)
    if not rule:
        raise not_found("exclusion_rule")
    rule["enabled"] = enabled
    audit_service.log(actor, "Updated exclusion rule", f"Settings / Exclusions \u2014 {rule['label']}")
    return rule


def list_integration_status() -> list[dict]:
    return _integrations


def list_permission_grants() -> dict[str, str]:
    return permissions_service.all_privileges()


def grant_permission(employee_id: str, privilege: str, actor: str) -> None:
    permissions_service.set_privilege(employee_id, privilege)  # type: ignore[arg-type]
    audit_service.log(actor, "Changed permission grant", f"Settings / Permissions \u2014 {employee_id} -> {privilege}")
