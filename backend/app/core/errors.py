"""Consistent API error envelope. Never leak stack traces, credentials, or
internal exception details to the client — see app/main.py's exception
handlers, which are the only place these get turned into HTTP responses."""
from __future__ import annotations

import uuid


class ApiException(Exception):
    def __init__(self, status_code: int, code: str, message: str):
        self.status_code = status_code
        self.code = code
        self.message = message
        super().__init__(message)


def new_request_id() -> str:
    return uuid.uuid4().hex[:12]


def not_found(resource: str) -> ApiException:
    return ApiException(404, f"{resource.upper()}_NOT_FOUND", f"{resource.replace('_', ' ').title()} could not be found.")


def forbidden(message: str = "You are not authorized to view this resource.") -> ApiException:
    return ApiException(403, "FORBIDDEN", message)


def bad_request(message: str) -> ApiException:
    return ApiException(400, "BAD_REQUEST", message)
