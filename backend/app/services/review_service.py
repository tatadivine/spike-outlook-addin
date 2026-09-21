"""Manager Review Center — AI findings awaiting human confirmation. A
review action is itself auditable (see audit_service)."""
from __future__ import annotations

from app.core.errors import forbidden, not_found
from app.mock import generator as gen
from app.schemas.domain import Identity
from app.services import audit_service, permissions_service


def list_for_identity(identity: Identity) -> list[dict]:
    if identity.role == "administrator":
        return gen.reviews
    visible = permissions_service.visible_employee_ids(identity.role, identity.employee_id) or []
    return [r for r in gen.reviews if r["employee_id"] in visible]


def apply_decision(identity: Identity, review_id: str, decision: str) -> dict:
    review = next((r for r in gen.reviews if r["id"] == review_id), None)
    if not review:
        raise not_found("review")
    if not permissions_service.can_view_employee(identity.role, identity.employee_id, review["employee_id"]):
        raise forbidden("You are not authorized to review this employee's findings.")
    if decision not in ("confirmed", "dismissed", "needs_context"):
        raise forbidden("Invalid review decision.")
    review["status"] = decision
    review["reviewer"] = identity.display_name
    audit_service.log(identity.display_name, f"{decision.replace('_', ' ').title()} AI finding", f"Review {review_id}")
    return review
