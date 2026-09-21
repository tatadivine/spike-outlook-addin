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
