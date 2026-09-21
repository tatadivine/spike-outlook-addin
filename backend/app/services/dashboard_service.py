"""
Builds the payload for GET /api/v1/dashboard.

This intentionally mirrors the frontend prototype's `buildPersonView` /
`ManagerRosterCard` logic (from Dashboard.tsx) closely — the whole point
of this service existing on the backend is so the already-agreed UI keeps
rendering the same thing, just sourced from an API call instead of a
locally-imported mock module.
"""
from __future__ import annotations

from app.mock import generator as gen
from app.mock.generator import ALEX_ID, HERO_MANAGER_ID


def _weeks() -> list[str]:
    return ["Oct 5\u201311", "Oct 12\u201318", "Oct 19\u201325", "Oct 26\u2013Nov 1"]


def build_trend(response_score: int) -> list[dict]:
    start = max(60, response_score - 14)
    weeks = _weeks()
    out = []
    for i, label in enumerate(weeks):
        t = i / (len(weeks) - 1)
        out.append({
            "label": label,
            "employee": round(start + (response_score - start) * t),
            "team": round((start - 4) + ((response_score - 5) - (start - 4)) * t),
        })
    return out


def sample_across_departments(limit: int = 6) -> list[dict]:
    seen: set[str] = set()
    out: list[dict] = []
    for e in gen.employees:
        if e["department"] in seen:
            continue
        seen.add(e["department"])
        out.append(e)
        if len(out) >= limit:
            break
    return out


def roster_for(viewer_role: str, viewer_employee_id: str | None) -> list[dict]:
    if viewer_role == "administrator":
        return sample_across_departments()
    if viewer_employee_id:
        return gen.direct_reports(viewer_employee_id)
    return []


def build_person_view(employee: dict | None) -> dict:
    is_alex = bool(employee) and employee["id"] == ALEX_ID
    is_sarah = bool(employee) and employee["id"] == HERO_MANAGER_ID

    if employee:
        response_score = employee["response_score"]
        median_hrs = round(employee["median_response_minutes"] / 60, 1)
        answered_24h = employee["answered_within_24h_pct"]
        positive_comm = employee["positive_communication_pct"]
    else:
        response_score = gen.org_aggregate["response_score"]
        median_hrs = round(gen.org_aggregate["median_response"] / 60, 1)
        answered_24h = 91
        positive_comm = gen.org_aggregate["positive_communication"]

    overdue_open = employee["overdue_follow_ups"] if employee else 7

    metrics = [
        {
            "label": "Response Score", "value": response_score, "suffix": "/ 100",
            "trend": "up", "trend_label": "+6", "progress_pct": response_score,
            "source": "Microsoft 365 communication records",
        },
        {
            "label": "Median Response", "value": median_hrs, "suffix": "hrs",
            "trend": "down", "trend_label": f"-{round(median_hrs * 0.36, 1)} hrs",
            "progress_pct": max(0, 100 - median_hrs * 10),
            "source": "Outlook response timestamps",
        },
        {
            "label": "Answered Within 24h", "value": answered_24h, "suffix": "%",
            "trend": "up", "trend_label": "+4 pts", "progress_pct": answered_24h,
            "source": "Response SLA rule engine",
        },
        {
            "label": "Positive Communication", "value": positive_comm, "suffix": "%",
            "trend": "up", "trend_label": "+5 pts", "progress_pct": positive_comm,
            "source": "Communication quality model (AI-assisted)",
        },
        {
            "label": "Overdue Follow-ups", "value": overdue_open,
            "trend": "down" if overdue_open > 4 else "flat", "trend_label": "-5",
            "progress_pct": min(100, overdue_open * 8),
            "source": "Follow-up tracking engine",
        },
    ]

    trend = build_trend(response_score)

    if is_alex:
        review_summary = {
            "overall_label": "Strong", "delta_points": 6, "filled_dots": 6, "total_dots": 7,
            "strengths": [
                {"title": "Clear ownership", "desc": "Takes responsibility and follows through."},
                {"title": "Respectful tone", "desc": "Professional and constructive."},
                {"title": "Timely customer replies", "desc": "Keeps customers informed."},
            ],
            "coaching": [
                {"title": f"{overdue_open} overdue follow-ups", "desc": "Require attention."},
                {"title": "3 unclear next steps", "desc": "Add specific next actions."},
            ],
        }
    elif is_sarah:
        review_summary = {
            "overall_label": "Strong", "delta_points": 4, "filled_dots": 6, "total_dots": 7,
            "strengths": [
                {"title": "Team SLA adherence", "desc": "Direct reports are meeting response commitments consistently."},
                {"title": "Escalation handling", "desc": "Customer escalations are acknowledged same-day."},
            ],
            "coaching": [
                {"title": f"{overdue_open} overdue follow-ups", "desc": "Spread across direct reports."},
                {"title": "Uneven response times", "desc": "Two team members trending above target median."},
            ],
        }
    else:
        review_summary = {
            "overall_label": "Solid", "delta_points": 3, "filled_dots": 5, "total_dots": 7,
            "strengths": [
                {"title": "Reliable response times", "desc": "Consistently answers within SLA."},
                {"title": "Professional tone", "desc": "Communications read as clear and respectful."},
            ],
            "coaching": [
                {"title": f"{overdue_open} overdue follow-ups", "desc": "Require attention."},
                {"title": "Follow-up cadence", "desc": "A few threads could use a scheduled check-in."},
            ],
        }

    if is_sarah:
        commitment_rows = [
            {"category": "Customers", "within_sla_pct": 94, "within_sla_numerator": 186, "within_sla_denominator": 198, "overdue": 6, "trend": "up"},
            {"category": "Internal Team", "within_sla_pct": 89, "within_sla_numerator": 121, "within_sla_denominator": 136, "overdue": 15, "trend": "up"},
            {"category": "Leadership", "within_sla_pct": 96, "within_sla_numerator": 49, "within_sla_denominator": 51, "overdue": 2, "trend": "flat"},
            {"category": "Direct Reports", "within_sla_pct": 87, "within_sla_numerator": 53, "within_sla_denominator": 61, "overdue": 8, "trend": "up"},
            {"category": "Total", "within_sla_pct": 92, "within_sla_numerator": 409, "within_sla_denominator": 446, "overdue": 31, "trend": "up", "bold": True},
        ]
    else:
        commitment_rows = [
            {"category": "Customers", "within_sla_pct": 95, "within_sla_numerator": 58, "within_sla_denominator": 61, "overdue": min(2, overdue_open), "trend": "up"},
            {"category": "Internal Team", "within_sla_pct": 90, "within_sla_numerator": 27, "within_sla_denominator": 30, "overdue": max(0, overdue_open - 2), "trend": "flat"},
            {"category": "Leadership", "within_sla_pct": 100, "within_sla_numerator": 9, "within_sla_denominator": 9, "overdue": 0, "trend": "flat"},
            {"category": "Total", "within_sla_pct": 92, "within_sla_numerator": 94, "within_sla_denominator": 100, "overdue": overdue_open, "trend": "up", "bold": True},
        ]

    quality_meters = [
        {"label": "Clarity", "sub": "Easy to understand", "pct": 91, "color": "#2f6bff"},
        {"label": "Respect", "sub": "Professional tone", "pct": 96, "color": "#157a4a"},
        {"label": "Ownership", "sub": "Takes responsibility", "pct": 88 if is_sarah else 84, "color": "#e8720c"},
        {"label": "Actionable Next Steps", "sub": "Includes next steps", "pct": 82 if is_sarah else 78, "color": "#f6821f"},
    ]

    if is_alex:
        evidence_items = [
            {"id": "ev-1", "title": "Clear customer update", "date": "Oct 30, 2024", "quote": "Provided detailed update to customer\u2026", "tag": "Customer", "positive": True, "ai_note": None},
            {"id": "ev-2", "title": "Constructive team feedback", "date": "Oct 28, 2024", "quote": "Shared helpful context with team\u2026", "tag": "Internal", "positive": True, "ai_note": None},
            {"id": "ev-3", "title": "Took ownership", "date": "Oct 24, 2024", "quote": "Owns issue and proposed solution\u2026", "tag": "Project", "positive": True, "ai_note": None},
            {"id": "ev-4", "title": "Delayed follow-up", "date": "Oct 22, 2024", "quote": "Reply sent 4 days after commitment date\u2026", "tag": "Customer", "positive": False, "ai_note": "Flagged by response-time rule, not content review."},
            {"id": "ev-5", "title": "Unclear next step", "date": "Oct 19, 2024", "quote": "No specific action or owner stated\u2026", "tag": "Internal", "positive": False, "ai_note": "AI-assisted language read; confidence: medium."},
            {"id": "ev-6", "title": "Missed acknowledgement", "date": "Oct 15, 2024", "quote": "Vendor request had no reply logged\u2026", "tag": "Vendor", "positive": False, "ai_note": "Derived from committed-date vs. reply-date fields."},
        ]
    else:
        evidence_items = [
            {"id": "ev-1", "title": "Prompt customer reply", "date": "Oct 29, 2024", "quote": "Responded within the hour with next steps\u2026", "tag": "Customer", "positive": True, "ai_note": None},
            {"id": "ev-2", "title": "Helpful internal note", "date": "Oct 26, 2024", "quote": "Added useful context for the team\u2026", "tag": "Internal", "positive": True, "ai_note": None},
            {"id": "ev-3", "title": "Overdue vendor thread", "date": "Oct 21, 2024", "quote": f"No reply logged for {max(3, overdue_open)} business days\u2026", "tag": "Vendor", "positive": False, "ai_note": "Flagged by response-time rule, not content review."},
        ]

    if is_alex:
        dashboard_alerts = [
            {"id": "a1", "severity": "high", "title": "Customer reply overdue", "subject": "Delivery Schedule Confirmation", "from": "operations@precision-mfg.com", "preview": "Please confirm the delivery schedule outlined below for PO 77921...", "meta": "26 hours", "action": "Respond Now"},
            {"id": "a2", "severity": "high", "title": "Vendor waiting for next step", "subject": "RFQ Response Update", "from": "supply.partner@steelworks.com", "preview": "Following up on lead time adjustment for the hydraulic assembly RFQ...", "meta": "Due today", "action": "Add Commitment"},
            {"id": "a3", "severity": "low", "title": "Internal request unanswered", "subject": "Component Specification Review", "from": "engineering.team@summit-eng.com", "preview": "Can you review the updated spec sheet before Thursday's kickoff?", "meta": "18 hours", "action": "Review"},
        ]
    elif overdue_open > 0:
        dashboard_alerts = [
            {"id": "gen-1", "severity": "high" if overdue_open > 5 else "low", "title": "Customer reply overdue", "subject": "Order status follow-up", "from": "customer.contact@example.com", "preview": "Checking in on the update you mentioned last week \u2014 any news?", "meta": f"{overdue_open} overdue", "action": "Respond Now"},
        ]
    else:
        dashboard_alerts = []

    first_name = (employee["name"].split(" ")[0].lower() if employee else "employee")
    excluded_messages = [
        {"subject": "System Maintenance Notice", "from": "it.support@summit-eng.com", "reason": "Automated / IT notification"},
        {"subject": "Benefits Enrollment Reminder", "from": "hr@summit-eng.com", "reason": "Distribution list / no response expected"},
        {"subject": "Out of Office: PTO Oct 14\u201318", "from": f"{first_name}@summit-eng.com", "reason": "Approved PTO \u2014 auto-reply"},
    ]

    weeks_above_goal = f"{sum(1 for w in trend if w['employee'] >= 90)} of {len(trend)} weeks"

    return {
        "scope_label": employee["name"] if employee else "Spike Electric \u2014 All Employees",
        "scope_subtitle": f"{employee['title']} \u00b7 {employee['department']}" if employee else "Organization-wide overview",
        "metrics": metrics,
        "overdue_open": overdue_open,
        "trend": trend,
        "weeks_above_goal": weeks_above_goal,
        "review_summary": review_summary,
        "commitment_rows": commitment_rows,
        "quality_meters": quality_meters,
        "evidence_items": evidence_items,
        "alerts": dashboard_alerts,
        "excluded_messages": excluded_messages,
    }
