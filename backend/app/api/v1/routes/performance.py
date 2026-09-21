from fastapi import APIRouter, Depends

from app.core.errors import not_found
from app.core.identity import get_current_identity
from app.mock import generator as gen
from app.schemas.domain import Identity

router = APIRouter(tags=["performance"])


@router.get("/performance")
def get_performance(identity: Identity = Depends(get_current_identity)):
    employee = gen.get_employee(identity.employee_id) if identity.employee_id else None
    if not employee:
        raise not_found("employee")
    return {
        "employee": employee,
        "commitments": gen.commitments_for_owner(employee["id"]),
        "follow_ups": gen.followups_for_owner(employee["id"]),
    }
