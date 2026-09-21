"""Determines who owns the next action on a thread — the employee, a
delegate, or someone else — used to keep metrics fair when work has been
explicitly handed off (see also exclusions.py's delegation rule)."""
from __future__ import annotations


def infer_ownership(comm: dict, delegated_from: str | None = None) -> str:
    if delegated_from:
        return f"Delegated from {delegated_from}"
    if comm.get("status") == "completed":
        return "Employee"
    return "Employee" if comm.get("category") != "internal" else "Shared"
