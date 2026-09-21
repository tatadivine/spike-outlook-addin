from __future__ import annotations

REPORTS = [
    {"id": "weekly-communication", "title": "Weekly Communication Report", "description": "A rolling summary of response performance and outstanding work."},
    {"id": "monthly-executive", "title": "Monthly Executive Report", "description": "Organization-wide performance for leadership review."},
    {"id": "team-performance", "title": "Team Performance Report", "description": "Manager-facing summary of team response and quality metrics."},
    {"id": "response-sla", "title": "Response SLA Report", "description": "SLA compliance by department and priority tier."},
    {"id": "commitment", "title": "Commitment Report", "description": "Open, completed, and overdue commitments across the organization."},
    {"id": "ai-coaching", "title": "AI Coaching Report", "description": "A summary of AI-assisted coaching insights and their review status."},
]


def list_reports() -> list[dict]:
    return REPORTS
