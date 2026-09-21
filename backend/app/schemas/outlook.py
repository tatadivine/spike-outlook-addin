"""
Schemas for the Outlook side-panel add-in (`outlook-addin/`) — the
component that actually runs inside Outlook's task pane, as opposed to
`/outlook`'s in-app *preview* of the same concept on the web dashboard.

These are intentionally separate from `Communication` in `domain.py`:
a `Communication` is a SpikeOS record that has gone through the full
pipeline (persisted, scored, tied to an owner's history). What the add-in
sees is either a live Microsoft Graph message that hasn't been ingested
anywhere yet, or — in mock mode — a stand-in built from the same mock
alerts already shown elsewhere in SpikeOS. Keeping these shapes distinct
means a change to one never silently breaks the other.
"""
from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel

from app.schemas.domain import CommClassification

OutlookMessageStatus = Literal["needs_response", "overdue", "excluded", "completed"]


class OutlookInboxRequest(BaseModel):
    # Graph-scoped access token the add-in acquired itself (Nested App
    # Authentication requesting User.Read + Mail.Read — see
    # outlook-addin/src/auth.ts). Its audience is already Microsoft Graph,
    # so the backend forwards it as-is; no On-Behalf-Of exchange is needed
    # for this specific, delegated, read-only path.
    graph_access_token: Optional[str] = None
    top: int = 25


class OutlookInboxMessage(BaseModel):
    id: str
    subject: str
    sender: str
    sender_email: str
    received_at: Optional[str] = None
    age_hours: float
    preview: str
    category: CommClassification
    excluded: bool
    exclusion_reason: Optional[str] = None
    sla_hours: int
    status: OutlookMessageStatus
    status_label: str
    is_read: Optional[bool] = None
    web_link: Optional[str] = None


class OutlookInboxSummaryCounts(BaseModel):
    total: int
    relevant: int
    needs_response: int
    overdue: int
    excluded: int


class OutlookInboxSummary(BaseModel):
    mode: Literal["live", "mock"]
    summary: OutlookInboxSummaryCounts
    messages: list[OutlookInboxMessage]
    message: Optional[str] = None


class OutlookMessageContextRequest(BaseModel):
    message_id: str
    subject: str
    sender: str
    body_preview: str = ""
    received_at: Optional[str] = None


class OutlookMessageContext(BaseModel):
    message_id: str
    category: CommClassification
    status: OutlookMessageStatus
    excluded: bool
    exclusion_reason: Optional[str] = None
    priority: str
    recommended_action: str
    response_score: int
    open_commitments: int
    within_24h_pct: int
