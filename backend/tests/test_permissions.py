from app.mock import generator as gen
from app.services import permissions_service


def _employee_outside_operations() -> str:
    for e in gen.employees:
        if e["department"] != "Operations":
            return e["id"]
    raise AssertionError("expected at least one non-Operations employee")


def test_employee_can_only_see_self():
    assert permissions_service.can_view_employee("employee", gen.ALEX_ID, gen.ALEX_ID) is True
    assert permissions_service.can_view_employee("employee", gen.ALEX_ID, "emp-michael-brown") is False


def test_manager_can_see_direct_reports():
    outsider_id = _employee_outside_operations()
    assert permissions_service.can_view_employee("manager", gen.HERO_MANAGER_ID, "emp-michael-brown") is True
    assert permissions_service.can_view_employee("manager", gen.HERO_MANAGER_ID, outsider_id) is False


def test_administrator_sees_everyone():
    assert permissions_service.can_view_employee("administrator", None, "emp-gen-1") is True


def test_visible_employee_ids_scopes_correctly():
    outsider_id = _employee_outside_operations()
    ids = permissions_service.visible_employee_ids("manager", gen.HERO_MANAGER_ID)
    assert gen.ALEX_ID in ids
    assert outsider_id not in ids

    assert permissions_service.visible_employee_ids("administrator", None) is None
