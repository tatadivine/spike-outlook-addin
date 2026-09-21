from __future__ import annotations

from app.core.errors import not_found
from app.mock import generator as gen


def list_customers() -> list[dict]:
    return gen.customers


def get_customer(customer_id: str) -> dict:
    customer = gen.get_customer(customer_id)
    if not customer:
        raise not_found("customer")
    return customer
