from fastapi import APIRouter, Depends

from app.core.errors import forbidden
from app.core.identity import get_current_identity
from app.schemas.domain import Identity
from app.services import organization_service

router = APIRouter(tags=["organization"])


def _require_leadership_or_admin(identity: Identity) -> None:
    if identity.role not in ("manager", "administrator"):
        raise forbidden("Organization-wide views require manager, leadership, or administrator access.")


@router.get("/organization")
def get_organization(identity: Identity = Depends(get_current_identity)):
    _require_leadership_or_admin(identity)
    return organization_service.organization_overview()


@router.get("/departments")
def get_departments(identity: Identity = Depends(get_current_identity)):
    _require_leadership_or_admin(identity)
    return organization_service.department_breakdown()


@router.get("/organization/trends")
def get_organization_trends(identity: Identity = Depends(get_current_identity)):
    _require_leadership_or_admin(identity)
    return organization_service.organization_trends()
