def test_inbox_summary_defaults_to_mock_mode(client, as_alex):
    resp = client.post("/api/v1/outlook/inbox-summary", json={"top": 10}, headers=as_alex)
    assert resp.status_code == 200
    body = resp.json()
    assert body["mode"] == "mock"
    assert "message" in body and body["message"]
    assert isinstance(body["messages"], list)
    assert body["summary"]["total"] == len(body["messages"])


def test_inbox_summary_reflects_the_signed_in_employee(client, as_alex, as_sarah):
    alex_resp = client.post("/api/v1/outlook/inbox-summary", json={}, headers=as_alex).json()
    sarah_resp = client.post("/api/v1/outlook/inbox-summary", json={}, headers=as_sarah).json()
    # Different people have different mock alert sets, so the inbox
    # contents (or at least counts) should not be identical by coincidence
    # across two different mock identities in the seeded dataset.
    assert alex_resp["messages"] != sarah_resp["messages"]


def test_inbox_summary_ignores_graph_token_when_data_source_is_mock(client, as_alex):
    resp = client.post(
        "/api/v1/outlook/inbox-summary",
        json={"graph_access_token": "not-a-real-token", "top": 5},
        headers=as_alex,
    )
    assert resp.status_code == 200
    # DATA_SOURCE=mock by default in tests — a Graph token must never be
    # sent to Microsoft Graph in that mode.
    assert resp.json()["mode"] == "mock"


def test_message_context_classifies_an_overdue_customer_message(client, as_alex):
    resp = client.post(
        "/api/v1/outlook/message-context",
        json={
            "message_id": "m-1",
            "subject": "Delivery Schedule Confirmation",
            "sender": "operations@precision-mfg.com",
            "body_preview": "Please confirm the delivery schedule.",
            "received_at": "2020-01-01T00:00:00Z",
        },
        headers=as_alex,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["category"] == "customer"
    assert body["status"] == "overdue"
    assert body["excluded"] is False


def test_message_context_excludes_automated_sender(client, as_alex):
    resp = client.post(
        "/api/v1/outlook/message-context",
        json={
            "message_id": "m-2",
            "subject": "Password reset confirmation",
            "sender": "noreply@spikeelectric.com",
            "body_preview": "This is an automated message.",
        },
        headers=as_alex,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["excluded"] is True
    assert body["status"] == "excluded"


def test_create_commitment_for_self(client, as_alex):
    resp = client.post(
        "/api/v1/commitments",
        json={"title": "Send updated quotation", "source": "Outlook add-in", "due_date": "2030-01-01"},
        headers=as_alex,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["owner_id"] == "emp-alex-johnson"
    assert body["status"] == "active"

    listed = client.get("/api/v1/commitments", headers=as_alex).json()
    assert any(c["id"] == body["id"] for c in listed)


def test_employee_cannot_create_commitment_for_someone_else(client, as_alex):
    resp = client.post(
        "/api/v1/commitments",
        json={
            "title": "Not yours to assign",
            "source": "Outlook add-in",
            "due_date": "2030-01-01",
            "owner_id": "emp-michael-brown",
        },
        headers=as_alex,
    )
    assert resp.status_code == 403


def test_manager_can_create_commitment_for_a_direct_report(client, as_sarah):
    resp = client.post(
        "/api/v1/commitments",
        json={
            "title": "Follow up with customer",
            "source": "Outlook add-in",
            "due_date": "2030-01-01",
            "owner_id": "emp-alex-johnson",
        },
        headers=as_sarah,
    )
    assert resp.status_code == 201
    assert resp.json()["owner_id"] == "emp-alex-johnson"
