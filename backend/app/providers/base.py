"""
Provider interfaces.

Every external system SpikeOS will eventually talk to (Microsoft Graph,
an AI model, Power BI, a notification channel, an analytics warehouse) is
accessed only through one of these interfaces. Services depend on the
interface type, never on a concrete provider class, so switching
DATA_SOURCE=mock -> DATA_SOURCE=microsoft (see factory.py) never requires
touching app/services/*.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class CommunicationProvider(ABC):
    @abstractmethod
    def list_for_owner(self, owner_id: str) -> list[dict]: ...

    @abstractmethod
    def get(self, communication_id: str) -> dict | None: ...

    @abstractmethod
    def list_all(self) -> list[dict]: ...


class AIProvider(ABC):
    """Communication quality / commitment detection / coaching. In mock
    mode this is backed by app/intelligence/*; in real mode it would call
    out to an LLM or hosted classifier."""

    @abstractmethod
    def analyze_communication(self, comm: dict) -> dict[str, Any]: ...


class PowerBIProvider(ABC):
    @abstractmethod
    def get_embed_config(self, report_key: str) -> dict[str, Any]: ...


class NotificationProvider(ABC):
    @abstractmethod
    def notify(self, employee_id: str, message: str) -> bool: ...


class AnalyticsProvider(ABC):
    @abstractmethod
    def track_event(self, name: str, properties: dict[str, Any]) -> None: ...
