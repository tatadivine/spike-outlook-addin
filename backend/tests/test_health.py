def test_health_ok(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["data_source"] == "mock"


def test_docs_available(client):
    assert client.get("/docs").status_code == 200
    assert client.get("/redoc").status_code == 200
