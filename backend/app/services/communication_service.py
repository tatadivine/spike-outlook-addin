"""Communication list/detail service — enforces that a caller may only see
communications they own, or (if manager/team_lead/administrator) that a
visible employee owns."""
from __future__ import annotations

from app.core.errors import forbidden, not_found
from app.providers.factory import get_communication_provider
from app.schemas.domain import Identity
from app.services import permissions_service


def list_for_identity(identity: Identity, owner_id: str | None = None) -> list[dict]:
    provider = get_communication_provider()
    target_owner = owner_id or identity.employee_id
    if not target_owner:
        return provider.list_all() if identity.role == "administrator" else []
    if not permissions_service.can_view_employee(identity.role, identity.employee_id, target_owner):
        raise forbidden("You are not authorized to view this employee's communications.")
    return provider.list_for_owner(target_owner)


def get_authorized(identity: Identity, communication_id: str) -> dict:
    provider = get_communication_provider()
    comm = provider.get(communication_id)
    if not comm:
        raise not_found("communication")
    if not permissions_service.can_view_employee(identity.role, identity.employee_id, comm["owner_id"]):
        raise forbidden("You are not authorized to view this communication.")
    return comm
