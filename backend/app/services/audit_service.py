"""Audit logging. Never logs message content — only who did what to which
resource and when, consistent with 'no sensitive email content in logs'."""
from __future__ import annotations

from app.mock import generator as gen


def list_audit_log() -> list[dict]:
    return gen.audit_log


def log(user: str, action: str, resource: str, result: str = "success") -> dict:
    return gen.append_audit_entry(user, action, resource, result)
