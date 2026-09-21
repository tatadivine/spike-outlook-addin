from fastapi import APIRouter, Depends

from app.core.errors import bad_request
from app.core.identity import get_current_identity
from app.schemas.domain import Identity
from app.schemas.outlook import (
    OutlookInboxRequest,
    OutlookInboxSummary,
    OutlookMessageContext,
    OutlookMessageContextRequest,
)
from app.services import outlook_service

router = APIRouter(tags=["outlook"])


@router.get("/outlook")
def get_outlook_coach(identity: Identity = Depends(get_current_identity)):
    """Backs the in-app preview of the side panel at /outlook on the web
    dashboard — not the real add-in. See /outlook/inbox-summary for that."""
    if not identity.employee_id:
        raise bad_request("Outlook Coach requires an employee identity.")
    return outlook_service.coach_payload(identity.employee_id)


@router.post("/outlook/inbox-summary", response_model=OutlookInboxSummary)
def outlook_inbox_summary(payload: OutlookInboxRequest, identity: Identity = Depends(get_current_identity)):
    """Called by outlook-addin/ on load and refresh. Identity comes from
    the same demo headers as the web app (see app/core/identity.py) —
    the add-in sends them too, configured in its own .env. The optional
    Graph access token in the body is a separate concern: it's what lets
    this specific call read *live* mailbox content when Microsoft Graph is
    configured (DATA_SOURCE=microsoft); it is never treated as proof of
    SpikeOS identity."""
    return outlook_service.inbox_summary(identity, payload.graph_access_token, payload.top)


@router.post("/outlook/message-context", response_model=OutlookMessageContext)
def outlook_message_context(payload: OutlookMessageContextRequest, identity: Identity = Depends(get_current_identity)):
    """Called by outlook-addin/ when the user opens a message's detail
    view — classifies that one message using the same exclusion/priority
    intelligence as the rest of SpikeOS."""
    return outlook_service.message_context(identity, payload)
