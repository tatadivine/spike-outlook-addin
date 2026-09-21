from fastapi import APIRouter, Depends, Query

from app.core.identity import get_current_identity
from app.schemas.domain import FollowUp, Identity
from app.services import followup_service

router = APIRouter(tags=["followups"])


@router.get("/followups", response_model=list[FollowUp])
def list_followups(identity: Identity = Depends(get_current_identity), owner_id: str | None = Query(default=None)):
    return followup_service.list_for_identity(identity, owner_id)
