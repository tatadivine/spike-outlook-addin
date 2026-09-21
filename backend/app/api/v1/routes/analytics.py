from fastapi import APIRouter, Depends

from app.core.errors import forbidden
from app.core.identity import get_current_identity
from app.schemas.domain import Identity
from app.services import analytics_service

router = APIRouter(tags=["analytics"])


@router.get("/analytics")
def get_analytics(identity: Identity = Depends(get_current_identity)):
    if identity.role not in ("manager", "administrator"):
        raise forbidden("Analytics requires manager, leadership, or administrator access.")
    return analytics_service.analytics_payload()
