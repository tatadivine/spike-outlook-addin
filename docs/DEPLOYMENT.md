# Deployment

```
GitHub Repository
  |
  +-- frontend/  -> Vercel
  |
  +-- backend/   -> Render
  |
Supabase -> PostgreSQL (future — not required for current mock-mode deploy)
```

## Vercel (frontend)

1. Import the repository into Vercel.
2. Set **Root Directory** to `frontend`.
3. Framework preset: Next.js (auto-detected).
4. Environment variables (Vercel dashboard, not committed):
   ```
   NEXT_PUBLIC_API_BASE_URL=https://spikeos-api.onrender.com/api/v1
   NEXT_PUBLIC_APP_NAME=SpikeOS
   NEXT_PUBLIC_DEMO_MODE=true
   ```
5. Deploy. Vercel only builds `frontend/` — it never needs `backend/` to
   exist, let alone build.

## Render (backend)

1. Create a new Web Service, root directory `backend`.
2. Runtime: Docker (uses the included `Dockerfile`), or native Python with:
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Health check path: `/health`.
4. Environment variables (Render dashboard, not committed) — see
   `backend/.env.example` and `backend/render.yaml` for the full list.
   Minimum for a mock-mode deploy:
   ```
   APP_ENV=production
   DEBUG=false
   FRONTEND_URL=https://your-vercel-domain.vercel.app
   DATA_SOURCE=mock
   AI_PROVIDER=mock
   POWERBI_PROVIDER=mock
   NOTIFICATION_PROVIDER=mock
   ANALYTICS_PROVIDER=mock
   ```
5. Deploy. Render only builds `backend/` — it never needs `frontend/`.

## Supabase (future — not required for the current mock-mode deploy)

1. Create a Supabase project.
2. `supabase link --project-ref <ref>`
3. `supabase db push` to apply `supabase/migrations/`.
4. Set `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY` on Render
   (never on Vercel) once the backend is wired to read from Postgres
   instead of the in-process mock generator.

## Deployment order

For a first deploy, backend before frontend (so you have the Render URL
to put in `NEXT_PUBLIC_API_BASE_URL`), but either can be redeployed
independently afterward — there is no build-time coupling between them.

## Verifying a deploy

- Backend: `curl https://<render-url>/health` should return
  `{"status": "ok", ...}`. `/docs` should load Swagger UI.
- Frontend: visiting the Vercel URL should redirect to `/login`; signing in
  as Employee should load `/dashboard` with real data (open the browser
  network tab and confirm requests go to your Render URL, not localhost).
- CORS: if the frontend shows network errors on real metrics but the
  backend's `/health` works directly, double-check `FRONTEND_URL` on
  Render matches the exact Vercel URL (including `https://`, no trailing
  slash).
