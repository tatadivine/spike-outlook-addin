from fastapi import APIRouter, Depends, Query

from app.core.errors import forbidden
from app.core.identity import get_current_identity
from app.mock import generator as gen
from app.schemas.domain import DashboardView, Identity, RosterEmployee
from app.services import dashboard_service, permissions_service

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard", response_model=DashboardView)
def get_dashboard(
    identity: Identity = Depends(get_current_identity),
    view_as: str | None = Query(default=None, description="Employee id to view (manager/administrator only)"),
):
    if view_as:
        if not permissions_service.can_view_employee(identity.role, identity.employee_id, view_as):
            raise forbidden("You are not authorized to view this employee's dashboard.")
        employee = gen.get_employee(view_as)
    else:
        employee = gen.get_employee(identity.employee_id) if identity.employee_id else None
    return dashboard_service.build_person_view(employee)


@router.get("/dashboard/roster", response_model=list[RosterEmployee])
def get_roster(identity: Identity = Depends(get_current_identity)):
    roster = dashboard_service.roster_for(identity.role, identity.employee_id)
    return [
        {
            "id": e["id"], "name": e["name"], "title": e["title"], "department": e["department"],
            "avatar_color": e["avatar_color"], "response_score": e["response_score"],
            "overdue_follow_ups": e["overdue_follow_ups"],
        }
        for e in roster
    ]
