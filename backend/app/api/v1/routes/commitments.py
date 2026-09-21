from fastapi import APIRouter, Depends, Query

from app.core.identity import get_current_identity
from app.schemas.domain import Commitment, CommitmentCreate, Identity
from app.services import commitment_service

router = APIRouter(tags=["commitments"])


@router.get("/commitments", response_model=list[Commitment])
def list_commitments(identity: Identity = Depends(get_current_identity), owner_id: str | None = Query(default=None)):
    return commitment_service.list_for_identity(identity, owner_id)


@router.post("/commitments", response_model=Commitment, status_code=201)
def create_commitment(payload: CommitmentCreate, identity: Identity = Depends(get_current_identity)):
    """Used by the web dashboard's commitment form and the Outlook add-in's
    'Add commitment' action on a message (see outlook-addin/)."""
    return commitment_service.create(identity, payload)
