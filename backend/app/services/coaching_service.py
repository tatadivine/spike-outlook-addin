from __future__ import annotations

from app.core.errors import forbidden
from app.mock import generator as gen
from app.schemas.domain import Identity
from app.services import permissions_service


def list_for_identity(identity: Identity, employee_id: str | None = None) -> list[dict]:
    target = employee_id or identity.employee_id
    if not target:
        return []
    if not permissions_service.can_view_employee(identity.role, identity.employee_id, target):
        raise forbidden("You are not authorized to view this employee's coaching insights.")
    return gen.insights_for_employee(target)
