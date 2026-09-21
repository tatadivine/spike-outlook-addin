"""
Server-side authorization.

The frontend's demo login only ever asserts an `account_type` (employee or
administrator) and, for employees, which employee they are — this is
exactly what Microsoft Entra ID will assert in production (identity, not
permission level). The mapping from identity -> effective `Role` lives
here, server-side, in `_privileges`, and only an administrator can change
it (via `set_privilege`). This is what "never trust frontend role
information for production authorization" means in practice: even in demo
mode, a person cannot elevate themselves to manager by editing the
frontend.
"""
from __future__ import annotations

from app.mock import generator as gen
from app.mock.generator import HERO_MANAGER_ID
from app.schemas.domain import PrivilegeLevel, Role

# Seed: Sarah Williams already manages a team.
_privileges: dict[str, PrivilegeLevel] = {
    HERO_MANAGER_ID: "manager",
}

PRIVILEGE_LABELS: dict[str, str] = {
    "standard": "Standard Employee",
    "team_lead": "Team Lead",
    "manager": "Manager",
}

PRIVILEGE_DESCRIPTIONS: dict[str, str] = {
    "standard": "Sees only their own communication dashboard.",
    "team_lead": "Adds a Manager View scoped to any direct reports assigned to them.",
    "manager": "Adds a Manager View with full visibility into their direct reports' dashboards.",
}


def get_privilege(employee_id: str) -> PrivilegeLevel:
    return _privileges.get(employee_id, "standard")


def set_privilege(employee_id: str, level: PrivilegeLevel) -> None:
    _privileges[employee_id] = level


def all_privileges() -> dict[str, PrivilegeLevel]:
    return dict(_privileges)


def privilege_to_role(privilege: PrivilegeLevel) -> Role:
    if privilege == "manager":
        return "manager"
    if privilege == "team_lead":
        return "team_lead"
    return "employee"


def role_for(account_type: str, employee_id: str | None) -> Role:
    if account_type == "administrator":
        return "administrator"
    if not employee_id:
        return "employee"
    return privilege_to_role(get_privilege(employee_id))


def can_view_employee(viewer_role: Role, viewer_employee_id: str | None, target_employee_id: str) -> bool:
    """The hierarchy rule enforced on every team/employee-scoped endpoint:
    - administrator: anyone
    - manager / team_lead: themselves, or anyone in their reporting chain
    - employee: only themselves
    """
    if viewer_role == "administrator":
        return True
    if viewer_employee_id == target_employee_id:
        return True
    if viewer_role in ("manager", "team_lead") and viewer_employee_id:
        reports = gen.all_reports_recursive(viewer_employee_id)
        return any(e["id"] == target_employee_id for e in reports)
    return False


def visible_employee_ids(viewer_role: Role, viewer_employee_id: str | None) -> list[str] | None:
    """Returns None to mean "all employees are visible" (administrator),
    otherwise a concrete list the viewer may see."""
    if viewer_role == "administrator":
        return None
    if viewer_role in ("manager", "team_lead") and viewer_employee_id:
        reports = gen.all_reports_recursive(viewer_employee_id)
        return [viewer_employee_id] + [e["id"] for e in reports]
    if viewer_employee_id:
        return [viewer_employee_id]
    return []
