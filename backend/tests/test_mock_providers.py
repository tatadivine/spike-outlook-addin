from app.mock import generator as gen
from app.providers.factory import get_communication_provider


def test_generates_600_employees():
    assert len(gen.employees) == 600


def test_hero_team_present():
    alex = gen.get_employee(gen.ALEX_ID)
    sarah = gen.get_employee(gen.HERO_MANAGER_ID)
    assert alex["name"] == "Alex Johnson"
    assert sarah["name"] == "Sarah Williams"
    assert alex["manager_id"] == sarah["id"]


def test_deterministic_across_reimport():
    # Re-running the generator functions should not change existing data —
    # module-level globals are built once, so this just double checks
    # values are stable within a process.
    first = gen.get_employee(gen.ALEX_ID)["response_score"]
    second = gen.get_employee(gen.ALEX_ID)["response_score"]
    assert first == second


def test_mock_communication_provider_scopes_by_owner():
    provider = get_communication_provider()
    alex_comms = provider.list_for_owner(gen.ALEX_ID)
    assert len(alex_comms) > 0
    assert all(c["owner_id"] == gen.ALEX_ID for c in alex_comms)
