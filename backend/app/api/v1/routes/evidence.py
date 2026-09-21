from fastapi import APIRouter

from app.schemas.domain import Evidence
from app.services import evidence_service

router = APIRouter(tags=["evidence"])


@router.get("/evidence", response_model=list[Evidence])
def list_evidence():
    return evidence_service.list_evidence()
