from fastapi import APIRouter

from app.schemas.domain import Customer
from app.services import customer_service

router = APIRouter(tags=["customers"])


@router.get("/customers", response_model=list[Customer])
def list_customers():
    return customer_service.list_customers()


@router.get("/customers/{customer_id}", response_model=Customer)
def get_customer(customer_id: str):
    return customer_service.get_customer(customer_id)
