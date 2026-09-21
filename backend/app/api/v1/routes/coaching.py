from fastapi import APIRouter, Depends, Query

from app.core.identity import get_current_identity
from app.schemas.domain import AIInsight, Identity
from app.services import coaching_service

router = APIRouter(tags=["coaching"])


@router.get("/coaching", response_model=list[AIInsight])
def list_coaching(identity: Identity = Depends(get_current_identity), employee_id: str | None = Query(default=None)):
    return coaching_service.list_for_identity(identity, employee_id)
