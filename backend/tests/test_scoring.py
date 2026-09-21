from app.intelligence import scoring


def test_score_breakdown_within_bounds():
    comms = [
        {"excluded": False, "category": "customer", "response_time_minutes": 60, "quality_score": 90, "ai_finding": {"ownership": "Employee"}},
        {"excluded": False, "category": "customer", "response_time_minutes": 2000, "quality_score": 70, "ai_finding": {"ownership": "Employee"}},
        {"excluded": True, "category": "customer", "response_time_minutes": 5000, "quality_score": 40, "ai_finding": None},
    ]
    commitments = [
        {"status": "completed", "days_overdue": 0},
        {"status": "overdue", "days_overdue": 3},
    ]
    result = scoring.compute_response_score(comms, commitments)
    assert 0 <= result.final_score <= 100
    # The excluded communication must not drag quality/response numbers down.
    assert result.communication_quality >= 70


def test_empty_population_has_sane_defaults():
    result = scoring.compute_response_score([], [])
    assert result.final_score > 0
