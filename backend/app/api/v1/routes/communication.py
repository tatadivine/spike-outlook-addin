from fastapi import APIRouter, Depends, Query

from app.core.identity import get_current_identity
from app.schemas.domain import Communication, Identity
from app.services import communication_service

router = APIRouter(tags=["communication"])


@router.get("/communications", response_model=list[Communication])
def list_communications(
    identity: Identity = Depends(get_current_identity),
    owner_id: str | None = Query(default=None),
):
    return communication_service.list_for_identity(identity, owner_id)


@router.get("/communications/{communication_id}", response_model=Communication)
def get_communication(communication_id: str, identity: Identity = Depends(get_current_identity)):
    return communication_service.get_authorized(identity, communication_id)
