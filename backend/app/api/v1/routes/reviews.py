from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.identity import get_current_identity
from app.schemas.domain import Identity, Review
from app.services import review_service

router = APIRouter(tags=["reviews"])


class ReviewDecision(BaseModel):
    decision: str  # confirmed | dismissed | needs_context


@router.get("/reviews", response_model=list[Review])
def list_reviews(identity: Identity = Depends(get_current_identity)):
    return review_service.list_for_identity(identity)


@router.patch("/reviews/{review_id}", response_model=Review)
def decide_review(review_id: str, body: ReviewDecision, identity: Identity = Depends(get_current_identity)):
    return review_service.apply_decision(identity, review_id, body.decision)
