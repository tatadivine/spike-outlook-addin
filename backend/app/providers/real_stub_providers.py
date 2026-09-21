"""Real-provider placeholders.

These raise clearly rather than pretending to work — DATA_SOURCE=microsoft
/ AI_PROVIDER=real must not be selectable in a way that silently falls
back to fake data. When Microsoft/AI credentials are available, replace
the body of each method here (or in app/integrations/microsoft/*) with a
real call; the interface and every call site stay the same.
"""
from __future__ import annotations

from typing import Any

from app.providers.base import (
    AIProvider,
    AnalyticsProvider,
    CommunicationProvider,
    NotificationProvider,
    PowerBIProvider,
)

_NOT_CONFIGURED = (
    "This integration is not yet configured. Set the required credentials "
    "and implement this provider before selecting it in production."
)


class MicrosoftGraphCommunicationProvider(CommunicationProvider):
    def list_for_owner(self, owner_id: str) -> list[dict]:
        raise NotImplementedError(_NOT_CONFIGURED)

    def get(self, communication_id: str) -> dict | None:
        raise NotImplementedError(_NOT_CONFIGURED)

    def list_all(self) -> list[dict]:
        raise NotImplementedError(_NOT_CONFIGURED)


class RealAIProvider(AIProvider):
    def analyze_communication(self, comm: dict) -> dict[str, Any]:
        raise NotImplementedError(_NOT_CONFIGURED)


class RealPowerBIProvider(PowerBIProvider):
    def get_embed_config(self, report_key: str) -> dict[str, Any]:
        raise NotImplementedError(_NOT_CONFIGURED)


class RealNotificationProvider(NotificationProvider):
    def notify(self, employee_id: str, message: str) -> bool:
        raise NotImplementedError(_NOT_CONFIGURED)


class RealAnalyticsProvider(AnalyticsProvider):
    def track_event(self, name: str, properties: dict[str, Any]) -> None:
        raise NotImplementedError(_NOT_CONFIGURED)
