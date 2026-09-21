from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.errors import forbidden
from app.core.identity import get_current_identity
from app.schemas.domain import ExclusionRule, Identity, IntegrationStatus, ScoringRule
from app.services import settings_service

router = APIRouter(tags=["settings"])


def _require_admin(identity: Identity) -> None:
    if identity.role != "administrator":
        raise forbidden("Settings are administrator-only.")


@router.get("/settings/scoring", response_model=list[ScoringRule])
def get_scoring_rules(identity: Identity = Depends(get_current_identity)):
    _require_admin(identity)
    return settings_service.list_scoring_rules()


class ScoringUpdate(BaseModel):
    value: str


@router.patch("/settings/scoring/{rule_id}", response_model=ScoringRule)
def update_scoring_rule(rule_id: str, body: ScoringUpdate, identity: Identity = Depends(get_current_identity)):
    _require_admin(identity)
    return settings_service.update_scoring_rule(rule_id, body.value, identity.display_name)


@router.get("/settings/exclusions", response_model=list[ExclusionRule])
def get_exclusion_rules(identity: Identity = Depends(get_current_identity)):
    _require_admin(identity)
    return settings_service.list_exclusion_rules()


class ExclusionUpdate(BaseModel):
    enabled: bool


@router.patch("/settings/exclusions/{rule_id}", response_model=ExclusionRule)
def update_exclusion_rule(rule_id: str, body: ExclusionUpdate, identity: Identity = Depends(get_current_identity)):
    _require_admin(identity)
    return settings_service.set_exclusion_rule(rule_id, body.enabled, identity.display_name)


@router.get("/settings/integrations", response_model=list[IntegrationStatus])
def get_integrations(identity: Identity = Depends(get_current_identity)):
    _require_admin(identity)
    return settings_service.list_integration_status()


@router.get("/settings/permissions")
def get_permissions(identity: Identity = Depends(get_current_identity)):
    _require_admin(identity)
    return settings_service.list_permission_grants()


class PermissionUpdate(BaseModel):
    employee_id: str
    privilege: str


@router.post("/settings/permissions")
def set_permission(body: PermissionUpdate, identity: Identity = Depends(get_current_identity)):
    _require_admin(identity)
    settings_service.grant_permission(body.employee_id, body.privilege, identity.display_name)
    return {"employee_id": body.employee_id, "privilege": body.privilege}


@router.get("/settings/audit")
def get_audit_log(identity: Identity = Depends(get_current_identity)):
    _require_admin(identity)
    from app.services import audit_service
    return audit_service.list_audit_log()
