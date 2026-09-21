"""
Demo identity resolution.

THIS IS NOT AUTHENTICATION. There is no signature verification, no token,
nothing cryptographic here — a request simply states who it claims to be
via two headers:

    X-Demo-Account-Type: employee | administrator
    X-Demo-Employee-Id:  <employee id, only when account_type=employee>

In production, this entire module is replaced by verifying a Microsoft
Entra ID access token (via MSAL) and reading the account type / employee
identity from its verified claims — nothing else in the application needs
to change, because every route already depends on `get_current_identity`
rather than reading headers itself.

Critically, the *role* (employee/team_lead/manager/administrator) is
NEVER taken from the request — it is always looked up server-side via
`permissions_service`, so a client cannot grant itself elevated access by
sending a different header.
"""
from __future__ import annotations

from fastapi import Header

from app.mock.generator import ALEX_ID, get_employee
from app.schemas.domain import Identity
from app.services import permissions_service


async def get_current_identity(
    x_demo_account_type: str | None = Header(default=None),
    x_demo_employee_id: str | None = Header(default=None),
) -> Identity:
    account_type = x_demo_account_type if x_demo_account_type in ("employee", "administrator") else "employee"

    if account_type == "administrator":
        role = permissions_service.role_for("administrator", None)
        return Identity(
            account_type="administrator",
            employee_id=None,
            display_name="System Administrator",
            title="SpikeOS Administrator",
            role=role,
        )

    employee_id = x_demo_employee_id or ALEX_ID
    employee = get_employee(employee_id) or get_employee(ALEX_ID)
    role = permissions_service.role_for("employee", employee["id"])
    return Identity(
        account_type="employee",
        employee_id=employee["id"],
        display_name=employee["name"],
        title=employee["title"],
        role=role,
    )
