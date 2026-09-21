from __future__ import annotations

from datetime import datetime, timezone

from app.core.errors import bad_request, forbidden
from app.mock import generator as gen
from app.schemas.domain import CommitmentCreate, Identity
from app.services import audit_service, permissions_service


def list_for_identity(identity: Identity, owner_id: str | None = None) -> list[dict]:
    target_owner = owner_id or identity.employee_id
    if not target_owner:
        return gen.commitments if identity.role == "administrator" else []
    if not permissions_service.can_view_employee(identity.role, identity.employee_id, target_owner):
        raise forbidden("You are not authorized to view this employee's commitments.")
    return gen.commitments_for_owner(target_owner)


def create(identity: Identity, payload: CommitmentCreate) -> dict:
    """Used by the web dashboard's commitment form and by the Outlook
    add-in's 'Add commitment' action on a message. Appends to the same
    in-process mock store everything else reads from — consistent with
    the rest of the platform's current mock-mode persistence model."""
    owner_id = payload.owner_id or identity.employee_id
    if not owner_id:
        raise bad_request("A commitment must have an owner.")
    if owner_id != identity.employee_id and not permissions_service.can_view_employee(
        identity.role, identity.employee_id, owner_id
    ):
        raise forbidden("You are not authorized to create commitments for this employee.")

    record = {
        "id": f"commit-{len(gen.commitments) + 1}",
        "title": payload.title,
        "source": payload.source,
        "owner_id": owner_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "due_date": payload.due_date,
        "status": "active",
        "days_overdue": 0,
        "next_action": payload.next_action,
    }
    gen.commitments.append(record)
    audit_service.log(identity.display_name, "Created commitment", f"Commitments — {payload.title}")
    return record
