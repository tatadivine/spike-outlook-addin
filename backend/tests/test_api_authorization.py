def test_employee_cannot_view_another_employees_communications(client, as_alex):
    resp = client.get("/api/v1/communications", params={"owner_id": "emp-michael-brown"}, headers=as_alex)
    assert resp.status_code == 403
    assert resp.json()["error"]["code"] == "FORBIDDEN"


def test_manager_can_view_direct_reports_communications(client, as_sarah):
    resp = client.get("/api/v1/communications", params={"owner_id": "emp-michael-brown"}, headers=as_sarah)
    assert resp.status_code == 200


def test_administrator_can_view_organization_endpoint(client, as_admin):
    resp = client.get("/api/v1/organization", headers=as_admin)
    assert resp.status_code == 200


def test_employee_cannot_view_organization_endpoint(client, as_alex):
    resp = client.get("/api/v1/organization", headers=as_alex)
    assert resp.status_code == 403


def test_settings_requires_administrator(client, as_sarah, as_admin):
    forbidden = client.get("/api/v1/settings/scoring", headers=as_sarah)
    assert forbidden.status_code == 403
    ok = client.get("/api/v1/settings/scoring", headers=as_admin)
    assert ok.status_code == 200


def test_dashboard_defaults_to_self(client, as_alex):
    resp = client.get("/api/v1/dashboard", headers=as_alex)
    assert resp.status_code == 200
    assert resp.json()["scope_label"] == "Alex Johnson"


def test_manager_view_as_requires_authorization(client, as_alex):
    resp = client.get("/api/v1/dashboard", params={"view_as": "emp-gen-5"}, headers=as_alex)
    assert resp.status_code == 403
