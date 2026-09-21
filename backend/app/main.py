"""
SpikeOS API entrypoint.

Run locally with:
    uvicorn app.main:app --reload --port 8000

Render runs this with:
    uvicorn app.main:app --host 0.0.0.0 --port $PORT
"""
from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.errors import ApiException, new_request_id

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("spikeos")

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description=(
        "SpikeOS Communication Effectiveness Platform API. Running in "
        f"DATA_SOURCE={settings.data_source} / AI_PROVIDER={settings.ai_provider} mode."
    ),
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS: only the configured frontend + Outlook add-in origin(s) — never
# "*" for anything that could carry authenticated traffic. Add more
# origins by extending this list (e.g. a staging Vercel preview URL) via
# FRONTEND_URL / OUTLOOK_ADDIN_URL.
_allowed_origins = [
    settings.frontend_url,
    "http://localhost:3000",
    settings.outlook_addin_url,
    "https://localhost:5174",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(dict.fromkeys(_allowed_origins)),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(ApiException)
async def api_exception_handler(request: Request, exc: ApiException):
    request_id = new_request_id()
    logger.warning("api_error request_id=%s code=%s path=%s", request_id, exc.code, request.url.path)
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.code, "message": exc.message, "request_id": request_id}},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    request_id = new_request_id()
    # Log the real exception server-side, but never leak internals to the client.
    logger.exception("unhandled_error request_id=%s path=%s", request_id, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"error": {"code": "INTERNAL_ERROR", "message": "Something went wrong.", "request_id": request_id}},
    )


@app.get("/health", tags=["health"])
def health():
    return {
        "status": "ok",
        "app": settings.app_name,
        "env": settings.app_env,
        "data_source": settings.data_source,
        "ai_provider": settings.ai_provider,
    }


app.include_router(api_router)
