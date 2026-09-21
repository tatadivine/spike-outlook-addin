from __future__ import annotations

from app.core.errors import forbidden
from app.mock import generator as gen
from app.schemas.domain import Identity
from app.services import permissions_service


def list_for_identity(identity: Identity, owner_id: str | None = None) -> list[dict]:
    target_owner = owner_id or identity.employee_id
    if not target_owner:
        return gen.follow_ups if identity.role == "administrator" else []
    if not permissions_service.can_view_employee(identity.role, identity.employee_id, target_owner):
        raise forbidden("You are not authorized to view this employee's follow-ups.")
    return gen.followups_for_owner(target_owner)
