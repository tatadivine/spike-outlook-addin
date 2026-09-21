from app.intelligence import exclusions


def test_approved_pto_excluded():
    comm = {"excluded": True, "exclusion_reason": "Employee was marked as unavailable (approved PTO)."}
    result = exclusions.evaluate(comm)
    assert result.excluded is True
    assert result.rule_id == "approved_pto"


def test_newsletter_excluded():
    comm = {"subject": "Monthly Newsletter — Industry Update", "body_preview": "", "contact": "marketing@vendor.com"}
    result = exclusions.evaluate(comm)
    assert result.excluded is True
    assert result.rule_id == "newsletters"


def test_ordinary_message_not_excluded():
    comm = {"subject": "RFQ follow-up", "body_preview": "Please review the attached quote.", "contact": "buyer@customer.com"}
    result = exclusions.evaluate(comm)
    assert result.excluded is False


def test_disabled_rule_is_not_applied():
    comm = {"subject": "Monthly Newsletter", "body_preview": "", "contact": "marketing@vendor.com"}
    result = exclusions.evaluate(comm, enabled_rule_ids=set())
    assert result.excluded is False
