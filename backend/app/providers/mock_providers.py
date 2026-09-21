"""Mock provider implementations — the default (DATA_SOURCE=mock,
AI_PROVIDER=mock, ...). These require zero external credentials and back
directly onto app/mock/generator.py and app/intelligence/*."""
from __future__ import annotations

from typing import Any

from app.intelligence import commitment_detector, communication_quality
from app.mock import generator as gen
from app.providers.base import (
    AIProvider,
    AnalyticsProvider,
    CommunicationProvider,
    NotificationProvider,
    PowerBIProvider,
)


class MockCommunicationProvider(CommunicationProvider):
    def list_for_owner(self, owner_id: str) -> list[dict]:
        return gen.communications_for_owner(owner_id)

    def get(self, communication_id: str) -> dict | None:
        return gen.get_communication(communication_id)

    def list_all(self) -> list[dict]:
        return gen.communications


class MockAIProvider(AIProvider):
    def analyze_communication(self, comm: dict) -> dict[str, Any]:
        quality = communication_quality.score(comm.get("body_preview", ""), comm.get("quality_score", 85))
        has_commitment, confidence, reasoning = commitment_detector.detect(comm.get("body_preview", ""))
        return {"quality": quality, "commitment_detected": has_commitment, "confidence_pct": confidence, "reasoning": reasoning}


class MockPowerBIProvider(PowerBIProvider):
    def get_embed_config(self, report_key: str) -> dict[str, Any]:
        return {
            "mode": "mock",
            "report_key": report_key,
            "message": "Power BI Embedded is not yet configured. Showing representative mock analytics.",
        }


class MockNotificationProvider(NotificationProvider):
    def notify(self, employee_id: str, message: str) -> bool:
        # In mock mode, "sending" a notification is a no-op that always
        # succeeds — there is nowhere for it to actually go yet.
        return True


class MockAnalyticsProvider(AnalyticsProvider):
    def track_event(self, name: str, properties: dict[str, Any]) -> None:
        return None
