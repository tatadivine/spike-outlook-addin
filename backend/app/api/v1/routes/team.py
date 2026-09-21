from fastapi import APIRouter, Depends

from app.core.identity import get_current_identity
from app.schemas.domain import Employee, Identity
from app.services import team_service

router = APIRouter(tags=["team"])


@router.get("/team", response_model=list[Employee])
def list_team(identity: Identity = Depends(get_current_identity)):
    return team_service.list_visible_employees(identity)


@router.get("/team/trends")
def team_trends(identity: Identity = Depends(get_current_identity)):
    return team_service.team_trends_for(identity)


@router.get("/team/{employee_id}", response_model=Employee)
def get_team_member(employee_id: str, identity: Identity = Depends(get_current_identity)):
    return team_service.get_employee_authorized(identity, employee_id)
