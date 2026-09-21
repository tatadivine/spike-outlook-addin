import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture()
def client():
    return TestClient(app)


@pytest.fixture()
def as_alex():
    return {"X-Demo-Account-Type": "employee", "X-Demo-Employee-Id": "emp-alex-johnson"}


@pytest.fixture()
def as_sarah():
    return {"X-Demo-Account-Type": "employee", "X-Demo-Employee-Id": "mgr-operations"}


@pytest.fixture()
def as_admin():
    return {"X-Demo-Account-Type": "administrator"}
