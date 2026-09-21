# SpikeOS — Outlook Side Panel Add-in

The real Microsoft Outlook add-in: a task pane that sideloads directly into
Outlook (web, desktop, or new Outlook) and shows the signed-in employee's
communication summary, with a message-level detail view when they open an
email.

This is a **separate deployable app** from `../frontend/` — different
build, different hosting, runs inside Outlook's own window chrome rather
than a browser tab. It talks to the same SpikeOS backend as the web
dashboard (`../backend/`).

If you only want to see what the panel looks like without any of the setup
below, open the web dashboard and go to **/outlook** — that's a mock
preview of this same concept, rendered inside a fake browser frame, no
Outlook required.

---

## 1. How it works (read this before configuring anything)

Two separate concerns, both important to keep straight:

1. **Who is this person in SpikeOS?** (`src/identity.ts`) — Today, the same
   demo-header mechanism the web dashboard uses
   (`X-Demo-Account-Type` / `X-Demo-Employee-Id`), read by the backend's
   `app/core/identity.py`. This is what decides whose data you see and
   what you're authorized to do (e.g. create a commitment). It will be
   replaced by a real, verified Microsoft Entra ID token later — see
   `../docs/SECURITY.md` — and nothing else in the add-in changes when
   that happens.
2. **What's in this person's actual mailbox right now?** (`src/auth.ts`) —
   A Microsoft Graph-scoped access token the add-in acquires itself, using
   Nested App Authentication (NAA), requesting only `User.Read` +
   `Mail.Read`. This is what unlocks **live inbox mode**. Without it (or
   without `DATA_SOURCE=microsoft` on the backend), the add-in shows that
   same employee's own SpikeOS **mock** inbox — never fabricated data
   pretending to be real. You'll see a small banner explaining which mode
   you're in.

You can run and fully evaluate this add-in with **zero Microsoft
credentials** — mock mode is the default and requires nothing beyond the
steps in Section 3. Section 6 covers turning on live mode.

---

## 2. Prerequisites

- Node.js 20+
- The SpikeOS backend running locally (`../backend/README.md`) or
  deployed somewhere reachable
- Outlook on the web, or Outlook desktop / new Outlook (Windows or Mac).
  Classic Outlook on Windows works too; a couple of sideloading steps
  differ slightly and are called out below.
- (For live inbox mode only) access to the Microsoft Entra tenant's app
  registrations — see Section 6

---

## 3. Run it locally in mock mode

```bash
cd outlook-addin
npm install
cp .env.example .env
npm run dev
```

This starts a local HTTPS dev server at `https://localhost:5174` (Office
Add-ins require HTTPS, even on localhost — `vite-plugin-basic-ssl`
generates a self-signed certificate for this automatically).

**Trust the certificate before sideloading**, or Outlook will silently
refuse to load the pane. Two ways to do this:

- Open `https://localhost:5174` directly in a browser once and accept the
  security warning, **or** (more reliable, especially for Outlook
  desktop):
  ```bash
  npx office-addin-dev-certs install
  ```
  This installs a certificate Office's own webview trusts, not just your
  regular browser.

Leave `npm run dev` running for the rest of this section.

---

## 4. Sideload it into Outlook

The manifest (`manifest.xml`) has two placeholder tokens —
`__MICROSOFT_CLIENT_ID__` and `__MICROSOFT_APP_ID_URI__` — used only for
live inbox mode (Section 6). For mock-mode testing you can sideload the
manifest as-is; those placeholders are simply unused until you fill them
in.

### Outlook on the web

1. Go to outlook.office.com and sign in.
2. Settings (gear icon) → **View all Outlook settings** → **Mail** →
   **Customize actions** → **Manage add-ins** — or open any message, click
   the **···** menu → **Get Add-ins**.
3. Choose **My add-ins** (left sidebar) → scroll to **Custom Addins** →
   **Add a custom add-in** → **Add from file...**
4. Select `outlook-addin/manifest.xml`.
5. Open any email. You should see a **SpikeOS** button in the ribbon
   (Message tab); click it to open the task pane.

### Outlook desktop (new Outlook / classic) and Mac

1. Open any message → ribbon → **Get Add-ins** (new Outlook / Mac) or
   **Store** (classic Outlook, Home tab).
2. **My add-ins** → **Custom Addins** → **Add from file** → select
   `manifest.xml`.
3. Classic Outlook on Windows can alternatively sideload via a **network
   shared folder** catalog if "Add from file" is disabled by policy — see
   Microsoft's "sideload Outlook add-ins" documentation for the shared
   folder registry steps if your organization has this restriction.
4. Open a message → the **SpikeOS** button appears on the ribbon.

### Validate the manifest first if something won't load

```bash
npx office-addin-manifest validate manifest.xml
```

---

## 5. What you should see

- **Summary view**: total inbox count, need-reply / overdue / excluded
  counts, a list of messages needing attention, and a link to open the
  full SpikeOS dashboard.
- **Detail view** (click a message): SpikeOS's classification of that
  message (category, SLA status, exclusion reason if any), a recommended
  action, an **Add commitment** button that creates a real commitment via
  `POST /commitments`, and a link to that message's full record in
  SpikeOS.
- A banner at the top explaining whether you're looking at live or mock
  data, and why.

If nothing loads: check the browser DevTools console inside the task pane
(right-click the pane → **Inspect**, in Outlook on the web) for the actual
error — almost always either a certificate-trust issue (Section 3) or the
backend not running / wrong `VITE_API_BASE_URL`.

---

## 6. Turning on live inbox mode (optional)

This requires one Microsoft Entra ID app registration, shared between the
add-in and the backend's future auth work.

### 6.1 Create the app registration

1. In the Azure Portal, go to **Microsoft Entra ID → App registrations →
   New registration**.
2. Name it (e.g. "SpikeOS"). Supported account type: single tenant, unless
   you specifically need multi-tenant.
3. Leave redirect URI blank for now — NAA doesn't use a traditional
   redirect flow the way a normal SPA login does.
4. Note the **Application (client) ID** and **Directory (tenant) ID** from
   the Overview page.

### 6.2 Expose an API (used as the token's audience)

1. **Expose an API** → **Add** next to Application ID URI → accept the
   default (`api://<client-id>`) or set your own — note the exact value.
2. **Add a scope** → name it `access_as_user` → set both admin and user
   consent → **Add scope**.

### 6.3 Add Microsoft Graph delegated permissions

1. **API permissions** → **Add a permission** → **Microsoft Graph** →
   **Delegated permissions** → add `User.Read` and `Mail.Read`.
2. Click **Grant admin consent** for the tenant (recommended, so
   individual users aren't prompted, though NAA can also prompt
   per-user the first time if you skip this).

### 6.4 Enable Nested App Authentication

NAA is what lets the add-in reuse the identity a person already has inside
Outlook, instead of a separate popup login. Its exact configuration
surface has changed as Microsoft has moved it toward general availability,
so treat this as a starting point and check Microsoft's current "Enable
SSO in an Office Add-in with nested app authentication" documentation for
anything that's shifted:

1. **Authentication** → under platform configurations, add a
   **Single-page application** platform (NAA currently piggybacks on the
   SPA platform type for token issuance).
2. Under that platform, enable **Access tokens** and **ID tokens**.
3. Ensure the manifest requirement set includes NAA support — this repo's
   `manifest.xml` already targets `Mailbox` requirement set `1.5`+, which
   is sufficient for current Outlook builds; very old Outlook versions
   fall back automatically to the `Office.auth.getAccessTokenAsync`
   compatibility path already coded in `src/auth.ts`.

### 6.5 Fill in the manifest and env files

In `manifest.xml`, replace:

- `__MICROSOFT_CLIENT_ID__` → the Application (client) ID from 6.1
- `__MICROSOFT_APP_ID_URI__` → the Application ID URI from 6.2

In `outlook-addin/.env`:

```
VITE_MICROSOFT_CLIENT_ID=<same client id>
VITE_MICROSOFT_TENANT_ID=<tenant id>
```

In `backend/.env`:

```
MICROSOFT_TENANT_ID=<tenant id>
MICROSOFT_CLIENT_ID=<same client id>
MICROSOFT_CLIENT_SECRET=<only needed if/when the backend does its own token validation — not required for this specific Graph-forwarding path>
DATA_SOURCE=microsoft
```

Restart both the add-in dev server and the backend, remove and re-add the
add-in in Outlook (Entra app changes sometimes need a fresh sideload to
take effect), and open a message. The banner should now say you're viewing
live data, or explain exactly why it fell back to mock if something in
this checklist was missed.

---

## 7. Deploying for real use (beyond your own machine)

1. Build it: `npm run build` → static output in `dist/`.
2. Host `dist/` behind a real HTTPS domain (any static host — Vercel,
   Azure Static Web Apps, S3+CloudFront, etc.). Self-signed localhost
   certificates only work for your own sideloaded testing.
3. Update `manifest.xml`: replace every `https://localhost:5174` with your
   real hosted URL (`IconUrl`, `HighResolutionIconUrl`, `AppDomains`,
   `SourceLocation`, the `bt:Image`/`bt:Url` resources).
4. Update `outlook-addin/.env` (or your build-time env) — `VITE_API_BASE_URL`
   to your deployed backend, `VITE_SPIKEOS_URL` to your deployed frontend.
5. Update `backend/.env` — add the add-in's real deployed origin to
   `OUTLOOK_ADDIN_URL` so CORS allows it.
6. For organization-wide rollout (instead of everyone sideloading
   manually): **Microsoft 365 admin center → Settings → Integrated apps →
   Upload custom apps**, upload the updated `manifest.xml`, and assign it
   to the users/groups who should get it automatically.

---

## 8. Troubleshooting

| Symptom | Likely cause |
|---|---|
| Task pane never loads / blank white pane | Certificate not trusted — run `npx office-addin-dev-certs install`, restart Outlook |
| "Office.js is not running" message | You opened the URL directly in a browser instead of through Outlook's sideloaded pane |
| Banner always says mock mode even after Section 6 | Check `DATA_SOURCE=microsoft` is actually set on the **backend** (not just the add-in's `.env`), and that the backend was restarted |
| `401`/`403` from the SpikeOS API | Check `VITE_DEMO_ACCOUNT_TYPE` / `VITE_DEMO_EMPLOYEE_ID` in `outlook-addin/.env` are valid identity values the backend recognizes |
| CORS error in the pane's DevTools console | `OUTLOOK_ADDIN_URL` on the backend doesn't match the origin the add-in is actually served from |
| "Add from file" is greyed out in Outlook | Your tenant restricts custom add-in sideloading by policy — use the Microsoft 365 admin center's Integrated apps flow instead (Section 7.6), or ask an admin to enable sideloading |
| Live inbox request fails with a Graph 403 | Admin consent wasn't granted for `Mail.Read` (Section 6.3), or the token audience/scopes don't match what `graph_client.py` expects |

---

## 9. Honest current limitations

- NAA setup (Section 6.4) is the newest part of this stack and the most
  likely to have shifted slightly by the time you read this — verify
  against Microsoft's current documentation rather than treating these
  steps as gospel.
- Live inbox mode only reads the signed-in user's **own** mailbox
  (delegated permissions) — there's no way, with this permission model,
  for one person's add-in session to read someone else's mail. That's a
  deliberate constraint, not a bug: a manager view of other people's
  communications is served from SpikeOS's own (currently mock) records,
  not a live Graph call on their behalf.
- `Add commitment` writes to the same in-process mock store the rest of
  the backend uses — it will reset when the backend restarts, until
  `DATA_SOURCE` moves to a real database.
