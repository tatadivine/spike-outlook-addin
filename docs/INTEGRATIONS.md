# Integrations

All integrations are **mock by default** and selected through environment
variables read exclusively by `backend/app/providers/factory.py`. Nothing
in this repository currently connects to a real Microsoft, Power BI, or AI
service — see `/settings/integrations` in the running app for a live,
honest status read-out of exactly this.

## Microsoft Entra ID (authentication) — future

- Will replace `backend/app/core/identity.py`'s demo header reading with
  verified Entra ID access token validation.
- Frontend will use MSAL (`@azure/msal-react` / `@azure/msal-browser`) in
  place of `frontend/src/lib/session.tsx`'s localStorage-based demo
  identity.
- Env vars already reserved: `MICROSOFT_TENANT_ID`, `MICROSOFT_CLIENT_ID`,
  `MICROSOFT_CLIENT_SECRET` (backend only — never in the frontend).

## Microsoft Graph (communication data) — future for the web dashboard, real for the Outlook add-in

- `backend/app/providers/real_stub_providers.py::MicrosoftGraphCommunicationProvider`
  is still a typed placeholder that raises `NotImplementedError` until
  implemented — this is what the *web dashboard's* `/communications` and
  related endpoints would read from once `DATA_SOURCE=microsoft`. Swap it
  in once ready — the interface (`backend/app/providers/base.py::CommunicationProvider`)
  is already the contract every service (`communication_service.py`, etc.)
  codes against.
- A narrower, already-real path exists for the **Outlook add-in**
  specifically: `backend/app/integrations/microsoft/graph_client.py` calls
  `GET /me/messages` directly with the Graph-scoped delegated token the
  add-in acquires client-side (Nested App Authentication — see
  `outlook-addin/src/auth.ts`). This does not go through the provider
  abstraction above because it isn't reading SpikeOS's own persisted
  communication records — it's a live, read-only mailbox summary scoped to
  whoever has the add-in open, used by `outlook_service.inbox_summary` /
  `message_context`. See `outlook-addin/README.md` for the Entra app
  registration steps.
- Planned scope for the fuller provider: Outlook mail, thread metadata,
  response tracking, calendar/PTO context, org info where authorized,
  change notifications. Least-privilege scopes only; no token storage
  beyond what's needed for the active session.

## Power BI (analytics) — future

- `/analytics` renders a mock embed area now
  (`backend/app/services/analytics_service.py` -> `MockPowerBIProvider`).
  The intent is Power BI **Embedded**, rendered inside the Next.js app —
  never a redirect to an external Power BI site.
- Real implementation: FastAPI generates the embed token/config
  server-side (`RealPowerBIProvider`), the frontend never holds Power BI
  client secrets.
- Env vars reserved: `POWERBI_TENANT_ID`, `POWERBI_CLIENT_ID`,
  `POWERBI_CLIENT_SECRET`, `POWERBI_WORKSPACE_ID`, `POWERBI_REPORT_ID`.

## AI provider (communication intelligence) — future

- `backend/app/intelligence/*` contains real, tested, rule-based logic
  (exclusions, scoring, commitment detection, quality scoring, coaching
  framing, priority/ownership inference) that already produces the
  AI-labeled findings seen throughout the app — including the Outlook
  add-in's message classification.
- `AI_PROVIDER=real` would route `MockAIProvider.analyze_communication`
  calls to `RealAIProvider` instead (backend/app/providers/factory.py),
  backed by `OPENAI_API_KEY` / `OPENAI_MODEL`. The rule-based functions in
  `intelligence/` remain useful as a fallback/sanity-check layer even once
  a real model is wired in.

## Outlook Communication Coach (in-app preview) vs. the real Outlook add-in

- `/outlook` on the web dashboard (`backend/app/services/outlook_service.py::coach_payload`)
  is a mock preview of the concept, rendered inside a fake browser-chrome
  frame — useful for demos, not something that actually runs in Outlook.
- `outlook-addin/` is the real thing: an Office Add-in that sideloads into
  Outlook's task pane, backed by `POST /outlook/inbox-summary` and
  `POST /outlook/message-context` (also in `outlook_service.py`). It works
  fully in mock mode today (each signed-in employee's own mock alerts,
  shaped like an inbox) and reads live mail once Microsoft Graph
  credentials are configured — see `outlook-addin/README.md` for the full
  setup, including the Entra app registration and Outlook sideloading
  steps.

## Notifications

- `MockNotificationProvider.notify` is a no-op that always succeeds.
  `RealNotificationProvider` is a typed placeholder for email/Teams/push
  delivery, selected via `NOTIFICATION_PROVIDER=real`.
