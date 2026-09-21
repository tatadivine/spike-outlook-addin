"""
Centralized application configuration.

All environment-driven behavior (which provider is active, CORS origins,
database connection, third-party credentials) is read here and nowhere
else. Nothing in `services/`, `api/`, or `intelligence/` should read
`os.environ` directly — they receive a `Settings` instance instead, which
keeps the provider-swap story (mock -> real) a one-line config change
rather than a code change.
"""
from functools import lru_cache
from typing import Literal

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # --- App -----------------------------------------------------------
    # Accepts both APP_ENV and APP_MODE as the env var name — some of our
    # own ops docs/scripts have used APP_MODE, so both populate the same
    # single field rather than being two independently-trackable settings.
    app_env: Literal["development", "staging", "production"] = Field(
        default="development", validation_alias=AliasChoices("APP_ENV", "APP_MODE")
    )
    app_name: str = "SpikeOS API"
    debug: bool = True
    frontend_url: str = "http://localhost:3000"
    # Origin the Outlook add-in is served from (separate from the main
    # frontend — it runs inside Outlook's task pane, not a browser tab
    # navigated to the SpikeOS web app). Needed for CORS.
    outlook_addin_url: str = "https://localhost:5174"

    # --- Providers -------------------------------------------------------
    # "mock" works with zero external credentials. "microsoft" / "real" are
    # the future production providers — see app/providers/factory.py.
    data_source: Literal["mock", "microsoft"] = "mock"

    # What i added


    outlook_live_inbox: bool = False


    ai_provider: Literal["mock", "real"] = "mock"
    powerbi_provider: Literal["mock", "real"] = "mock"
    notification_provider: Literal["mock", "real"] = "mock"
    analytics_provider: Literal["mock", "real"] = "mock"

    # --- Database (Supabase Postgres) ------------------------------------
    # Optional while DATA_SOURCE=mock — the mock provider runs entirely
    # in-process and does not require a database connection.
    database_url: str | None = None
    supabase_url: str | None = None
    supabase_publishable_key: str | None = None
    # Supabase's dashboard has referred to this same key as both "secret
    # key" and "service role key" across versions — both env var names are
    # accepted and populate this one field.
    supabase_secret_key: str | None = Field(
        default=None, validation_alias=AliasChoices("SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY")
    )

    # --- Microsoft ---------------------------------------------------------
    # Entra ID app registration used both for the future real auth provider
    # and for the Outlook add-in's Nested App Authentication resource.
    microsoft_tenant_id: str | None = None
    microsoft_client_id: str | None = None
    microsoft_client_secret: str | None = None

    # --- Power BI ----------------------------------------------------------
    powerbi_tenant_id: str | None = None
    powerbi_client_id: str | None = None
    powerbi_client_secret: str | None = None
    powerbi_workspace_id: str | None = None
    powerbi_report_id: str | None = None

    # --- AI (OpenAI) ------------------------------------------------------
    # Only read when AI_PROVIDER=real; see app/providers/real_stub_providers.py.
    openai_api_key: str | None = None
    openai_model: str = "gpt-5.6-mini"

    # --- Auth (placeholder until Microsoft Entra ID is wired in) --------
    jwt_secret: str = "dev-only-insecure-secret-change-me"


@lru_cache
def get_settings() -> Settings:
    """Settings are read once per process and cached; tests override via
    dependency_overrides rather than re-instantiating this directly."""
    return Settings()
