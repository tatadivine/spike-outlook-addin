from fastapi import APIRouter, Depends, Query

from app.core.identity import get_current_identity
from app.schemas.domain import AlertItem, Identity
from app.services import alert_service

router = APIRouter(tags=["alerts"])


@router.get("/alerts", response_model=list[AlertItem])
def list_alerts(identity: Identity = Depends(get_current_identity), owner_id: str | None = Query(default=None)):
    return alert_service.list_for_identity(identity, owner_id)
