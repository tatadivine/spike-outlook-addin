"""
Minimal, real Microsoft Graph client for the Outlook add-in's live inbox
mode (see `app/services/outlook_service.py`).

This intentionally does NOT go through `app/providers/` — the provider
abstraction models *SpikeOS's own* communication records (persisted,
scored, owned by someone), which is a bigger integration
(`MicrosoftGraphCommunicationProvider` in `real_stub_providers.py`) still
pending Postgres wiring. This client is a narrower, already-real path: the
add-in acquires its own Graph-scoped delegated token client-side (Nested
App Authentication, requesting only `User.Read` + `Mail.Read` — see
`outlook-addin/src/auth.ts`), and this module simply forwards that token to
Graph to read the signed-in user's own recent messages. No client secret,
On-Behalf-Of exchange, or application permission is required for this
specific flow.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from urllib.parse import quote

import httpx

GRAPH_BASE = "https://graph.microsoft.com/v1.0"
_SELECT = "id,conversationId,subject,from,receivedDateTime,isRead,webLink,bodyPreview"


class GraphRequestError(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)


def list_recent_messages(access_token: str, top: int = 25) -> list[dict]:
    """The signed-in user's most recent inbox messages. Raises
    `GraphRequestError` on any non-2xx response so the caller can decide
    whether to fall back to mock data (expired token, missing consent,
    throttling) rather than silently returning an empty inbox."""
    try:
        response = httpx.get(
            f"{GRAPH_BASE}/me/messages",
            headers={"Authorization": f"Bearer {access_token}"},
            params={"$top": top, "$select": _SELECT, "$orderby": "receivedDateTime desc"},
            timeout=15,
        )
    except httpx.HTTPError as exc:
        raise GraphRequestError(502, f"Could not reach Microsoft Graph: {exc}") from exc

    if response.status_code != 200:
        raise GraphRequestError(response.status_code, response.text[:500])

    return response.json().get("value", [])


# ---------------------------------------------------------------------------
# App-only (client credentials) access
# ---------------------------------------------------------------------------
# Everything above this line is the add-in's *delegated* path: the browser
# already holds a user-scoped token and this module just forwards it.
#
# The web dashboard's /communications routes cannot work that way. They
# serve a manager looking at someone else's records, and there is no
# delegated token for that other person in the request. That requires
# app-only access: a client-credentials token plus the **application**
# permission `Mail.Read` (not the delegated one), granted with admin
# consent. See `app/providers/graph_communication_provider.py`.


class GraphNotConfiguredError(Exception):
    """Raised when app-only Graph access is selected but the credentials
    needed for it are absent. Distinct from GraphRequestError so callers
    can tell "you haven't set this up" apart from "Microsoft said no"."""


class GraphPermissionError(GraphRequestError):
    """Graph accepted the token but refused the operation — almost always
    a missing *application* permission or absent admin consent, which no
    amount of retrying will fix."""


_TOKEN_ENDPOINT = "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token"
_app_token_cache: dict[str, tuple[str, datetime]] = {}


def get_app_access_token(
    tenant_id: str | None, client_id: str | None, client_secret: str | None
) -> str:
    """Client-credentials token for app-only Graph calls, cached in-process
    until 60s before expiry. Raises GraphNotConfiguredError rather than
    returning None so a misconfiguration surfaces as a clear error instead
    of a silent fallback to fabricated data."""
    if not (tenant_id and client_id and client_secret):
        missing = [
            name
            for name, value in (
                ("MICROSOFT_TENANT_ID", tenant_id),
                ("MICROSOFT_CLIENT_ID", client_id),
                ("MICROSOFT_CLIENT_SECRET", client_secret),
            )
            if not value
        ]
        raise GraphNotConfiguredError(
            "App-only Microsoft Graph access requires " + ", ".join(missing) + "."
        )

    cached = _app_token_cache.get(client_id)
    now = datetime.now(timezone.utc)
    if cached and cached[1] > now:
        return cached[0]

    try:
        response = httpx.post(
            _TOKEN_ENDPOINT.format(tenant=tenant_id),
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "scope": "https://graph.microsoft.com/.default",
                "grant_type": "client_credentials",
            },
            timeout=15,
        )
    except httpx.HTTPError as exc:
        raise GraphRequestError(502, f"Could not reach Microsoft Entra ID: {exc}") from exc

    if response.status_code != 200:
        raise GraphRequestError(response.status_code, response.text[:500])

    body = response.json()
    token = body.get("access_token")
    if not token:
        raise GraphRequestError(502, "Entra ID returned no access_token.")

    expires_in = int(body.get("expires_in", 3600))
    _app_token_cache[client_id] = (token, now + timedelta(seconds=max(expires_in - 60, 60)))
    return token


def _app_get(access_token: str, path: str, params: dict) -> dict:
    try:
        response = httpx.get(
            f"{GRAPH_BASE}{path}",
            headers={"Authorization": f"Bearer {access_token}"},
            params=params,
            timeout=20,
        )
    except httpx.HTTPError as exc:
        raise GraphRequestError(502, f"Could not reach Microsoft Graph: {exc}") from exc

    if response.status_code in (401, 403):
        raise GraphPermissionError(
            response.status_code,
            "Microsoft Graph refused this app-only request. Grant the "
            "**application** permission Mail.Read (Microsoft Graph > "
            "Application permissions) and click 'Grant admin consent'. "
            f"Graph said: {response.text[:300]}",
        )
    if response.status_code != 200:
        raise GraphRequestError(response.status_code, response.text[:500])

    return response.json()


def list_messages_for_mailbox(access_token: str, mailbox: str, top: int = 50) -> list[dict]:
    """Recent inbox messages for an arbitrary mailbox, via app-only access."""
    data = _app_get(
        access_token,
        f"/users/{quote(mailbox)}/mailFolders/inbox/messages",
        {"$top": top, "$select": _SELECT, "$orderby": "receivedDateTime desc"},
    )
    return data.get("value", [])


def list_sent_for_mailbox(access_token: str, mailbox: str, top: int = 100) -> list[dict]:
    """Recent Sent Items for a mailbox. Used to work out whether — and how
    quickly — the owner actually replied, by matching conversationId."""
    data = _app_get(
        access_token,
        f"/users/{quote(mailbox)}/mailFolders/sentitems/messages",
        {"$top": top, "$select": "id,conversationId,sentDateTime", "$orderby": "sentDateTime desc"},
    )
    return data.get("value", [])
