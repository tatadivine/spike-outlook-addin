"""Provider factory — the ONLY place that reads DATA_SOURCE / AI_PROVIDER
/ POWERBI_PROVIDER / NOTIFICATION_PROVIDER to decide which concrete
provider class backs each interface. Swapping an integration in
production is changing one environment variable, never application code.
"""
from __future__ import annotations

from functools import lru_cache

from app.core.config import Settings, get_settings
from app.providers.base import (
    AIProvider,
    AnalyticsProvider,
    CommunicationProvider,
    NotificationProvider,
    PowerBIProvider,
)
from app.providers.mock_providers import (
    MockAIProvider,
    MockAnalyticsProvider,
    MockCommunicationProvider,
    MockNotificationProvider,
    MockPowerBIProvider,
)
from app.providers.real_stub_providers import (
    MicrosoftGraphCommunicationProvider,
    RealAIProvider,
    RealAnalyticsProvider,
    RealNotificationProvider,
    RealPowerBIProvider,
)


@lru_cache
def get_communication_provider(settings: Settings | None = None) -> CommunicationProvider:
    settings = settings or get_settings()
    if settings.data_source == "microsoft":
        return MicrosoftGraphCommunicationProvider()
    return MockCommunicationProvider()


@lru_cache
def get_ai_provider(settings: Settings | None = None) -> AIProvider:
    settings = settings or get_settings()
    if settings.ai_provider == "real":
        return RealAIProvider()
    return MockAIProvider()


@lru_cache
def get_powerbi_provider(settings: Settings | None = None) -> PowerBIProvider:
    settings = settings or get_settings()
    if settings.powerbi_provider == "real":
        return RealPowerBIProvider()
    return MockPowerBIProvider()


@lru_cache
def get_notification_provider(settings: Settings | None = None) -> NotificationProvider:
    settings = settings or get_settings()
    if settings.notification_provider == "real":
        return RealNotificationProvider()
    return MockNotificationProvider()


@lru_cache
def get_analytics_provider(settings: Settings | None = None) -> AnalyticsProvider:
    settings = settings or get_settings()
    if settings.analytics_provider == "real":
        return RealAnalyticsProvider()
    return MockAnalyticsProvider()
