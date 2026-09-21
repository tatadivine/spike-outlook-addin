"""
Backs two distinct things, both under the `outlook` tag:

1. `coach_payload` — the mock Outlook Communication Coach panel shown
   in-app at /outlook (a *preview* of the concept on the web dashboard).
2. `inbox_summary` / `message_context` — the real Outlook side-panel
   add-in (`outlook-addin/`), which actually runs inside Outlook's task
   pane. These go through the same exclusion/priority intelligence used
   elsewhere in SpikeOS rather than duplicating the logic.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from app.core.config import get_settings
from app.intelligence import exclusions, priority_analyzer
from app.mock import generator as gen
from app.schemas.domain import Identity
from app.schemas.outlook import (
    OutlookInboxMessage,
    OutlookInboxSummary,
    OutlookInboxSummaryCounts,
    OutlookMessageContext,
    OutlookMessageContextRequest,
)
from app.services import settings_service

logger = logging.getLogger("spikeos.outlook_addin")

DEFAULT_SLA_HOURS = 24
INTERNAL_DOMAIN = "spikeelectric.com"


def coach_payload(employee_id: str) -> dict:
    employee = gen.get_employee(employee_id)
    alerts = gen.alerts_for_owner(employee_id)[:4]
    return {
        "response_score": employee["response_score"] if employee else 85,
        "alerts": alerts,
        "positive_followthrough": "Customer commitment completed on time.",
    }


# --- Outlook side-panel add-in -------------------------------------------------


def _age_hours(received_at_iso: str | None) -> float:
    if not received_at_iso:
        return 0.0
    try:
        received = datetime.fromisoformat(received_at_iso.replace("Z", "+00:00"))
    except ValueError:
        return 0.0
    return round((datetime.now(timezone.utc) - received).total_seconds() / 3600, 1)


def _category_for_sender(sender_email: str) -> str:
    domain = sender_email.split("@")[-1].lower() if "@" in sender_email else ""
    return "internal" if domain == INTERNAL_DOMAIN else "customer"


def _classify_graph_message(message: dict, enabled_rules: set[str]) -> OutlookInboxMessage:
    sender_field = (message.get("from") or {}).get("emailAddress") or {}
    sender_name = sender_field.get("name") or sender_field.get("address") or "Unknown sender"
    sender_email = sender_field.get("address") or ""
    subject = message.get("subject") or "(no subject)"
    preview = message.get("bodyPreview") or ""
    received_at = message.get("receivedDateTime")

    exclusion = exclusions.evaluate(
        {"contact": sender_email, "subject": subject, "body_preview": preview}, enabled_rules
    )
    age_hours = _age_hours(received_at)

    if exclusion.excluded:
        status, status_label = "excluded", "Excluded"
    elif age_hours > DEFAULT_SLA_HOURS:
        status, status_label = "overdue", "Overdue"
    elif message.get("isRead"):
        status, status_label = "completed", "Completed"
    else:
        status, status_label = "needs_response", "Response needed"

    return OutlookInboxMessage(
        id=message.get("id", ""),
        subject=subject,
        sender=sender_name,
        sender_email=sender_email,
        received_at=received_at,
        age_hours=age_hours,
        preview=preview,
        category=_category_for_sender(sender_email),
        excluded=exclusion.excluded,
        exclusion_reason=exclusion.reason,
        sla_hours=DEFAULT_SLA_HOURS,
        status=status,
        status_label=status_label,
        is_read=message.get("isRead"),
        web_link=message.get("webLink"),
    )


def _mock_inbox_messages(employee_id: str) -> list[OutlookInboxMessage]:
    """Builds an inbox-shaped view from this same employee's mock alerts,
    so mock mode reflects the person actually signed in rather than
    disconnected fixture data."""
    alerts = gen.alerts_for_owner(employee_id)[:8]
    out: list[OutlookInboxMessage] = []
    for alert in alerts:
        is_overdue = alert["category"] == "overdue"
        status = "overdue" if is_overdue else "needs_response"
        source = alert.get("source", "Unknown sender")
        out.append(
            OutlookInboxMessage(
                id=alert["id"],
                subject=alert["reason"],
                sender=source,
                sender_email=f"{source.lower().replace(' ', '.')}@example.com",
                received_at=alert.get("time"),
                age_hours=_age_hours(alert.get("time")),
                preview=alert["recommended_action"],
                category="customer",
                excluded=False,
                exclusion_reason=None,
                sla_hours=DEFAULT_SLA_HOURS,
                status=status,
                status_label="Overdue" if is_overdue else "Response needed",
                is_read=not is_overdue,
                web_link=None,
            )
        )
    return out


def _summarize(messages: list[OutlookInboxMessage]) -> OutlookInboxSummaryCounts:
    return OutlookInboxSummaryCounts(
        total=len(messages),
        relevant=len([m for m in messages if not m.excluded]),
        needs_response=len([m for m in messages if m.status == "needs_response"]),
        overdue=len([m for m in messages if m.status == "overdue"]),
        excluded=len([m for m in messages if m.excluded]),
    )


def inbox_summary(identity: Identity, graph_access_token: str | None, top: int) -> OutlookInboxSummary:
    settings = get_settings()
    enabled_rules = settings_service.enabled_evaluated_exclusion_rule_ids()

    if graph_access_token and settings.data_source == "microsoft":
        from app.integrations.microsoft import graph_client

        try:
            raw_messages = graph_client.list_recent_messages(graph_access_token, top)
        except graph_client.GraphRequestError as exc:
            logger.warning("graph_inbox_fetch_failed status=%s detail=%s", exc.status_code, exc.detail)
        else:
            messages = [_classify_graph_message(m, enabled_rules) for m in raw_messages]
            return OutlookInboxSummary(mode="live", summary=_summarize(messages), messages=messages)

    employee_id = identity.employee_id or gen.ALEX_ID
    messages = _mock_inbox_messages(employee_id)
    if settings.data_source != "microsoft":
        note = "Microsoft Graph is not configured yet (DATA_SOURCE=mock) — showing this employee's SpikeOS mock inbox."
    elif not graph_access_token:
        note = "No Microsoft Graph token was supplied — showing this employee's SpikeOS mock inbox instead."
    else:
        note = "Live inbox connection is temporarily unavailable — showing this employee's SpikeOS mock inbox instead."
    return OutlookInboxSummary(mode="mock", summary=_summarize(messages), messages=messages, message=note)


def message_context(identity: Identity, payload: OutlookMessageContextRequest) -> OutlookMessageContext:
    employee_id = identity.employee_id or gen.ALEX_ID
    employee = gen.get_employee(employee_id)
    enabled_rules = settings_service.enabled_evaluated_exclusion_rule_ids()

    exclusion = exclusions.evaluate(
        {"contact": payload.sender, "subject": payload.subject, "body_preview": payload.body_preview},
        enabled_rules,
    )
    age_hours = _age_hours(payload.received_at)
    category = _category_for_sender(payload.sender)
    priority = priority_analyzer.infer_priority(payload.subject, category)

    if exclusion.excluded:
        status = "excluded"
    elif age_hours > DEFAULT_SLA_HOURS:
        status = "overdue"
    else:
        status = "needs_response"

    return OutlookMessageContext(
        message_id=payload.message_id,
        category=category,
        status=status,
        excluded=exclusion.excluded,
        exclusion_reason=exclusion.reason,
        priority=priority,
        recommended_action=(
            "Respond now and record the next step" if status == "overdue" else "Review and respond within the SLA"
        ),
        response_score=employee["response_score"] if employee else 85,
        open_commitments=len(gen.commitments_for_owner(employee_id)),
        within_24h_pct=employee["answered_within_24h_pct"] if employee else 90,
    )
