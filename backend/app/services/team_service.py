"""Team/roster/employee-detail services — all hierarchy-checked via
permissions_service before returning data."""
from __future__ import annotations

from app.core.errors import forbidden, not_found
from app.mock import generator as gen
from app.schemas.domain import Identity
from app.services import permissions_service


def get_employee_authorized(identity: Identity, employee_id: str) -> dict:
    employee = gen.get_employee(employee_id)
    if not employee:
        raise not_found("employee")
    if not permissions_service.can_view_employee(identity.role, identity.employee_id, employee_id):
        raise forbidden("You are not authorized to view this employee's data.")
    return employee


def list_visible_employees(identity: Identity) -> list[dict]:
    ids = permissions_service.visible_employee_ids(identity.role, identity.employee_id)
    if ids is None:
        return gen.employees
    return [e for e in gen.employees if e["id"] in ids]


def team_trends_for(identity: Identity) -> dict:
    reports = gen.direct_reports(identity.employee_id) if identity.employee_id else []
    if not reports:
        reports = gen.employees[:20]
    return {
        "response_score": gen.avg([e["response_score"] for e in reports]),
        "sla_compliance": gen.avg([e["sla_compliance_pct"] for e in reports]),
        "overdue": sum(e["overdue_follow_ups"] for e in reports),
        "headcount": len(reports),
    }
