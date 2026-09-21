"""
Deterministic mock dataset — ~600 employees across 7 departments, plus
communications, commitments, follow-ups, alerts, customers, AI insights,
manager reviews, evidence, and an audit log.

This module builds everything ONCE at import time (module-level globals)
so every request across the app sees the same consistent data — this is
the "don't create separate random mock data for every page" requirement.
When DATA_SOURCE=microsoft, none of this module is imported; see
app/providers/factory.py.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional

from app.mock import pools
from app.mock.seed import Rng, rng_for

ALEX_ID = "emp-alex-johnson"
HERO_MANAGER_ID = "mgr-operations"


def _iso(days_ago: int, hour: int = 9, minute: int = 0) -> str:
    d = datetime.now(timezone.utc) - timedelta(days=days_ago)
    d = d.replace(hour=hour, minute=minute, second=0, microsecond=0)
    return d.isoformat()


def _iso_future(days_ahead: int, hour: int = 17) -> str:
    d = datetime.now(timezone.utc) + timedelta(days=days_ahead)
    d = d.replace(hour=hour, minute=0, second=0, microsecond=0)
    return d.isoformat()


# ---------------------------------------------------------------------------
# Employees
# ---------------------------------------------------------------------------

employees: list[dict] = []
_used_names: set[str] = set()
_dept_manager_ids: dict[str, str] = {
    d: f"mgr-{d.lower().replace(' ', '-')}" for d in pools.DEPARTMENTS
}


def _full_name(rng: Rng) -> str:
    guard = 0
    while True:
        name = f"{rng.pick(pools.FIRST_NAMES)} {rng.pick(pools.LAST_NAMES)}"
        guard += 1
        if name not in _used_names or guard > 50:
            _used_names.add(name)
            return name


def _make_employee(rng: Rng, id_: str, name: str, title: str, department: str, manager_id: Optional[str]) -> dict:
    response_score = rng.randint(68, 98)
    return {
        "id": id_,
        "name": name,
        "title": title,
        "department": department,
        "manager_id": manager_id,
        "email": f"{name.lower().replace(' ', '.')}@spikeelectric.com",
        "avatar_color": rng.pick(pools.AVATAR_COLORS),
        "response_score": response_score,
        "median_response_minutes": rng.randint(35, 620),
        "answered_within_24h_pct": rng.randint(78, 99),
        "positive_communication_pct": rng.randint(70, 97),
        "overdue_follow_ups": rng.pick_weighted([(0, 5), (1, 3), (2, 2), (3, 1), (4, 1)]),
        "open_commitments": rng.randint(0, 9),
        "sla_compliance_pct": rng.randint(80, 99),
    }


def _build_employees() -> None:
    base_rng = rng_for("employees-seed", 1)

    _used_names.add("Sarah Williams")
    employees.append(_make_employee(base_rng, HERO_MANAGER_ID, "Sarah Williams", "Operations Manager", "Operations", None))

    _used_names.add("Alex Johnson")
    employees.append(_make_employee(base_rng, ALEX_ID, "Alex Johnson", "Operations Coordinator", "Operations", HERO_MANAGER_ID))

    hero_reports = [
        ("emp-michael-brown", "Michael Brown", "Field Service Lead"),
        ("emp-daniel-carter", "Daniel Carter", "Operations Analyst"),
        ("emp-emily-davis", "Emily Davis", "Operations Coordinator"),
    ]
    for id_, name, title in hero_reports:
        _used_names.add(name)
        employees.append(_make_employee(base_rng, id_, name, title, "Operations", HERO_MANAGER_ID))

    for dept in pools.DEPARTMENTS:
        if dept == "Operations":
            continue
        name = _full_name(base_rng)
        employees.append(_make_employee(base_rng, _dept_manager_ids[dept], name, f"{dept} Manager", dept, None))

    counter = 1
    while len(employees) < 600:
        dept = base_rng.pick(pools.DEPARTMENTS)
        manager_id = _dept_manager_ids[dept]
        name = _full_name(base_rng)
        title = base_rng.pick(pools.TITLES_BY_DEPT[dept])
        employees.append(_make_employee(base_rng, f"emp-gen-{counter}", name, title, dept, manager_id))
        counter += 1


_build_employees()

_by_id = {e["id"]: e for e in employees}


def get_employee(employee_id: str) -> Optional[dict]:
    return _by_id.get(employee_id)


def direct_reports(manager_id: str) -> list[dict]:
    return [e for e in employees if e["manager_id"] == manager_id]


def all_reports_recursive(manager_id: str) -> list[dict]:
    """Every employee under `manager_id` anywhere in the chain — used to
    check whether a manager/team_lead is authorized to view someone."""
    out: list[dict] = []
    frontier = direct_reports(manager_id)
    while frontier:
        out.extend(frontier)
        next_frontier: list[dict] = []
        for e in frontier:
            next_frontier.extend(direct_reports(e["id"]))
        frontier = next_frontier
    return out


def department_employees(dept: str) -> list[dict]:
    return [e for e in employees if e["department"] == dept]


def avg(nums: list[float]) -> int:
    if not nums:
        return 0
    return round(sum(nums) / len(nums))


def department_aggregate(dept: str) -> dict:
    emps = department_employees(dept)
    return {
        "department": dept,
        "headcount": len(emps),
        "response_score": avg([e["response_score"] for e in emps]),
        "median_response": avg([e["median_response_minutes"] for e in emps]),
        "sla_compliance": avg([e["sla_compliance_pct"] for e in emps]),
        "overdue": sum(e["overdue_follow_ups"] for e in emps),
        "open_commitments": sum(e["open_commitments"] for e in emps),
        "positive_communication": avg([e["positive_communication_pct"] for e in emps]),
    }


org_aggregate = {
    "headcount": len(employees),
    "response_score": avg([e["response_score"] for e in employees]),
    "median_response": avg([e["median_response_minutes"] for e in employees]),
    "sla_compliance": avg([e["sla_compliance_pct"] for e in employees]),
    "overdue": sum(e["overdue_follow_ups"] for e in employees),
    "open_commitments": sum(e["open_commitments"] for e in employees),
    "positive_communication": avg([e["positive_communication_pct"] for e in employees]),
}

# ---------------------------------------------------------------------------
# Communications
# ---------------------------------------------------------------------------

communications: list[dict] = []
_comm_counter = 1


def _build_timeline(received_at: str, responded_at: Optional[str], has_commitment: bool) -> list[dict]:
    events = [{"id": "t1", "label": "Message received", "timestamp": received_at, "actor": "System"}]
    if responded_at:
        events.append({"id": "t2", "label": "Employee acknowledged", "timestamp": received_at, "actor": "Employee"})
        if has_commitment:
            events.append({"id": "t3", "label": "Commitment created", "timestamp": responded_at, "actor": "SpikeOS"})
            events.append({"id": "t4", "label": "Follow-up reminder scheduled", "timestamp": responded_at, "actor": "SpikeOS"})
        events.append({"id": "t5", "label": "Response sent", "timestamp": responded_at, "actor": "Employee"})
        events.append({"id": "t6", "label": "Closed", "timestamp": responded_at, "actor": "System"})
    return events


def _build_communication(rng: Rng, owner_id: str, force_overdue_exclusion: bool = False) -> dict:
    global _comm_counter
    category = rng.pick_weighted([("customer", 5), ("vendor", 2), ("internal", 3)])
    org = (
        rng.pick(pools.CUSTOMER_COMPANIES)
        if category == "customer"
        else rng.pick(pools.VENDOR_COMPANIES) if category == "vendor" else "Spike Electric — Internal"
    )
    subject = (
        rng.pick(pools.SUBJECTS_CUSTOMER)
        if category == "customer"
        else rng.pick(pools.SUBJECTS_VENDOR) if category == "vendor" else rng.pick(pools.SUBJECTS_INTERNAL)
    )
    contact = "Internal Team" if category == "internal" else rng.pick(pools.CONTACT_NAMES)

    days_ago = rng.randint(0, 12)
    received_at = _iso(days_ago, rng.randint(7, 17), rng.pick([0, 15, 30, 45]))
    priority = rng.pick_weighted([("low", 2), ("normal", 5), ("high", 3), ("critical", 1)])
    target = 24 * 60 if category == "customer" else 48 * 60

    responded_at = None
    response_time_minutes = None

    if force_overdue_exclusion:
        status = "completed"
        responded_at = _iso(max(days_ago - 1, 0), 14, 18)
        response_time_minutes = 28 * 60 + 36
    else:
        outcome = rng.pick_weighted([("open", 3), ("responded_fast", 5), ("responded_slow", 2)])
        if outcome == "open":
            status = ("overdue" if rng.chance(0.5) else "waiting") if days_ago > 1 else "needs_response"
        else:
            resp_minutes = (
                rng.randint(20, max(60, target - 60))
                if outcome == "responded_fast"
                else rng.randint(target + 30, target + 24 * 60)
            )
            responded_dt = datetime.fromisoformat(received_at) + timedelta(minutes=resp_minutes)
            responded_at = responded_dt.isoformat()
            response_time_minutes = resp_minutes
            status = "completed"

    has_commitment = status == "completed" and rng.chance(0.35)
    quality_score = rng.randint(72, 98)

    ai_finding = None
    if force_overdue_exclusion or rng.chance(0.6):
        over_sla = response_time_minutes is not None and response_time_minutes > target
        ai_finding = {
            "id": f"aif-{_comm_counter}",
            "response_required": category != "internal" or rng.chance(0.7),
            "priority": priority,
            "ownership": "Employee",
            "commitment_detected": has_commitment,
            "due_date": _iso_future(rng.randint(2, 10)) if has_commitment else None,
            "next_action": "Send follow-up confirmation to contact" if has_commitment else "No further action required",
            "quality_score": quality_score,
            "confidence_pct": rng.randint(78, 97),
            "review_status": (
                "needs_context" if force_overdue_exclusion
                else rng.pick_weighted([("pending", 3), ("confirmed", 1), ("dismissed", 1)]) if over_sla
                else "confirmed"
            ),
            "reasoning": (
                "Response time exceeded the applicable SLA target for this communication category."
                if over_sla
                else "Communication pattern matches a standard, timely response with no risk indicators."
            ),
        }

    excluded = force_overdue_exclusion
    comm = {
        "id": f"comm-{_comm_counter}",
        "contact": contact,
        "organization": org,
        "category": category,
        "subject": subject,
        "body_preview": (
            f'{contact} at {org} is requesting an update regarding "{subject.lower()}". Please review and respond with next steps.'
            if category == "customer"
            else f'{org} has sent a note regarding "{subject.lower()}". A response may be required to keep the order on schedule.'
            if category == "vendor"
            else f'Internal note from {contact} regarding "{subject.lower()}".'
        ),
        "received_at": received_at,
        "responded_at": responded_at,
        "response_time_minutes": response_time_minutes,
        "status": status,
        "priority": priority,
        "owner_id": owner_id,
        "next_step": "Send customer quotation" if has_commitment else ("None — resolved" if status == "completed" else "Review and respond"),
        "quality_score": quality_score,
        "ai_finding": ai_finding,
        "timeline": _build_timeline(received_at, responded_at, has_commitment),
        "excluded": excluded,
        "exclusion_reason": "Employee was marked as unavailable (approved PTO) for part of the response window." if excluded else None,
    }
    _comm_counter += 1
    return comm


def _build_communications() -> None:
    rng = rng_for("communications-seed", 2)
    owners = [ALEX_ID, "emp-michael-brown", "emp-daniel-carter", "emp-emily-davis", HERO_MANAGER_ID]
    for idx, owner_id in enumerate(owners):
        count = 42 if owner_id == ALEX_ID else 16
        for i in range(count):
            communications.append(_build_communication(rng, owner_id, force_overdue_exclusion=(idx == 0 and i == 3)))


_build_communications()


def communications_for_owner(owner_id: str) -> list[dict]:
    return [c for c in communications if c["owner_id"] == owner_id]


def get_communication(comm_id: str) -> Optional[dict]:
    return next((c for c in communications if c["id"] == comm_id), None)


# ---------------------------------------------------------------------------
# Commitments / follow-ups / alerts
# ---------------------------------------------------------------------------

commitments: list[dict] = []
_commit_counter = 1


def _build_commitments_for(rng: Rng, owner_id: str, n: int) -> None:
    global _commit_counter
    titles = [
        "Send updated quotation to customer", "Provide compliance certificate",
        "Confirm install crew schedule", "Deliver revised project timeline",
        "Send warranty claim resolution", "Share updated pricing sheet",
        "Follow up on outage root cause report",
    ]
    for _ in range(n):
        status = rng.pick_weighted([("active", 4), ("due_today", 1), ("due_this_week", 3), ("overdue", 2), ("completed", 4)])
        days_overdue = rng.randint(1, 9) if status == "overdue" else 0
        commitments.append({
            "id": f"commit-{_commit_counter}",
            "title": rng.pick(titles),
            "source": rng.pick(pools.CUSTOMER_COMPANIES),
            "owner_id": owner_id,
            "created_at": _iso(rng.randint(3, 20)),
            "due_date": _iso(days_overdue) if status == "overdue" else _iso(0) if status == "due_today" else _iso_future(rng.randint(1, 7)),
            "status": status,
            "days_overdue": days_overdue,
            "next_action": "Closed" if status == "completed" else "Send update to contact and close loop",
        })
        _commit_counter += 1


def _build_commitments() -> None:
    rng = rng_for("commitments-seed", 3)
    _build_commitments_for(rng, ALEX_ID, 14)
    for owner_id in ["emp-michael-brown", "emp-daniel-carter", "emp-emily-davis"]:
        _build_commitments_for(rng, owner_id, 10)


_build_commitments()


def commitments_for_owner(owner_id: str) -> list[dict]:
    return [c for c in commitments if c["owner_id"] == owner_id]


follow_ups: list[dict] = []
_fu_counter = 1


def _build_followups_for(rng: Rng, owner_id: str, n: int) -> None:
    global _fu_counter
    for _ in range(n):
        status = rng.pick_weighted([("open", 4), ("overdue", 2), ("due_today", 1), ("completed", 4), ("escalated", 1)])
        follow_ups.append({
            "id": f"fu-{_fu_counter}",
            "contact": rng.pick(pools.CONTACT_NAMES),
            "subject": rng.pick(pools.SUBJECTS_CUSTOMER),
            "owner_id": owner_id,
            "due_date": _iso(rng.randint(1, 6)) if status == "overdue" else _iso_future(rng.randint(0, 6)),
            "status": status,
            "last_activity": _iso(rng.randint(0, 4)),
            "next_action": "Closed" if status == "completed" else "Send follow-up message to confirm status",
        })
        _fu_counter += 1


def _build_followups() -> None:
    rng = rng_for("followups-seed", 4)
    _build_followups_for(rng, ALEX_ID, 11)
    for owner_id in ["emp-michael-brown", "emp-daniel-carter", "emp-emily-davis"]:
        _build_followups_for(rng, owner_id, 8)


_build_followups()


def followups_for_owner(owner_id: str) -> list[dict]:
    return [f for f in follow_ups if f["owner_id"] == owner_id]


alerts: list[dict] = []
_alert_counter = 1


def _build_alerts_for(rng: Rng, owner_id: str, n: int) -> None:
    global _alert_counter
    templates = [
        ("overdue", "Customer response overdue by 2 days.", "Respond immediately to protect SLA compliance."),
        ("needs_response", "Vendor waiting for requested information.", "Reply with the requested documentation."),
        ("needs_response", "Internal request has not been acknowledged.", "Acknowledge and confirm ownership."),
        ("commitment", "Commitment due tomorrow.", "Confirm delivery or reschedule the commitment."),
        ("positive_indicator", "Positive follow-through detected.", "No action needed — recognized in coaching summary."),
        ("follow_up", "Scheduled follow-up has not been sent.", "Send the follow-up message to the contact."),
        ("ai_coaching", "Response pattern flagged for review.", "Review the AI-assisted finding and add context if needed."),
    ]
    for _ in range(n):
        category, reason, action = rng.pick(templates)
        alerts.append({
            "id": f"alert-{_alert_counter}",
            "category": category,
            "severity": rng.pick_weighted([("low", 3), ("medium", 4), ("high", 2)]),
            "time": _iso(rng.randint(0, 5), rng.randint(7, 18)),
            "source": rng.pick(pools.CUSTOMER_COMPANIES + pools.VENDOR_COMPANIES + ["Internal"]),
            "reason": reason,
            "recommended_action": action,
            "owner_id": owner_id,
        })
        _alert_counter += 1


def _build_alerts() -> None:
    rng = rng_for("alerts-seed", 5)
    _build_alerts_for(rng, ALEX_ID, 9)
    for owner_id in ["emp-michael-brown", "emp-daniel-carter", "emp-emily-davis"]:
        _build_alerts_for(rng, owner_id, 5)


_build_alerts()


def alerts_for_owner(owner_id: str) -> list[dict]:
    return [a for a in alerts if a["owner_id"] == owner_id]


# ---------------------------------------------------------------------------
# Customers
# ---------------------------------------------------------------------------

customers: list[dict] = []


def _build_customers() -> None:
    rng = rng_for("customers-seed", 6)
    industries = [
        "Industrial Manufacturing", "Utilities & Grid Infrastructure", "Logistics & Distribution",
        "Rail & Transit", "Materials & Fabrication", "Energy Production",
    ]
    for i, name in enumerate(pools.CUSTOMER_COMPANIES):
        customers.append({
            "id": f"cust-{i + 1}",
            "name": name,
            "industry": rng.pick(industries),
            "open_communications": rng.randint(1, 14),
            "avg_response_minutes": rng.randint(90, 900),
            "outstanding_commitments": rng.randint(0, 6),
            "follow_ups": rng.randint(0, 5),
            "health": rng.pick_weighted([("strong", 5), ("steady", 3), ("at_risk", 2)]),
        })


_build_customers()


def get_customer(customer_id: str) -> Optional[dict]:
    return next((c for c in customers if c["id"] == customer_id), None)


# ---------------------------------------------------------------------------
# AI coaching insights
# ---------------------------------------------------------------------------

insights: list[dict] = [
    {
        "id": "ins-1", "employee_id": ALEX_ID, "kind": "strength",
        "headline": "Your response time improved 18% this month.",
        "why": "SpikeOS compared your rolling 30-day median response time against the prior period.",
        "evidence": "Median response fell from 4h 32m to 3h 42m across 38 tracked communications.",
        "confidence_pct": 94, "review_status": "unreviewed",
    },
    {
        "id": "ins-2", "employee_id": ALEX_ID, "kind": "follow_through",
        "headline": "You consistently close customer commitments on time.",
        "why": "11 of your last 12 commitments were completed before their due date.",
        "evidence": "Commitment log for Apex Manufacturing, Vertex Energy, and Meridian Systems.",
        "confidence_pct": 91, "review_status": "unreviewed",
    },
    {
        "id": "ins-3", "employee_id": ALEX_ID, "kind": "follow_through",
        "headline": "Three conversations may benefit from a follow-up.",
        "why": "SpikeOS detected open questions with no follow-up scheduled in the last 5 business days.",
        "evidence": "Threads with Northstar Logistics, Cobalt Wire & Cable, and an internal request from Finance.",
        "confidence_pct": 82, "review_status": "unreviewed",
    },
    {
        "id": "ins-4", "employee_id": ALEX_ID, "kind": "response",
        "headline": "High-priority messages get your fastest responses.",
        "why": "Median response time on 'high' and 'critical' priority items is 46 minutes, well inside target.",
        "evidence": "Analysis of 9 high-priority communications over the last 30 days.",
        "confidence_pct": 88, "review_status": "unreviewed",
    },
    {
        "id": "ins-5", "employee_id": ALEX_ID, "kind": "improve",
        "headline": "Internal requests take longer to acknowledge than customer requests.",
        "why": "Median acknowledgement time for internal messages is 2.4x longer than customer messages.",
        "evidence": "Comparison of 14 internal vs. 22 customer communications this month.",
        "confidence_pct": 76, "review_status": "unreviewed",
    },
    {
        "id": "ins-6", "employee_id": ALEX_ID, "kind": "positive",
        "headline": "Customers describe your updates as clear and proactive.",
        "why": "Communication quality scoring on outbound customer replies averaged 92/100.",
        "evidence": "Quality analysis across 19 customer-facing replies in the last 30 days.",
        "confidence_pct": 85, "review_status": "unreviewed",
    },
]


def insights_for_employee(employee_id: str) -> list[dict]:
    return [i for i in insights if i["employee_id"] == employee_id]


# ---------------------------------------------------------------------------
# Manager review center (AI findings awaiting human review)
# ---------------------------------------------------------------------------

reviews: list[dict] = []


def _build_reviews() -> None:
    pending = [
        c for c in communications
        if c["ai_finding"] and c["ai_finding"]["review_status"] in ("pending", "needs_context")
    ][:14]
    for i, c in enumerate(pending):
        finding = (
            "Response exceeded 24-hour target."
            if c["ai_finding"]["review_status"] == "needs_context"
            else f"Communication quality flagged at {c['ai_finding']['quality_score']}/100."
        )
        reviews.append({
            "id": f"rev-{i + 1}",
            "employee_id": c["owner_id"],
            "finding": finding,
            "evidence": f"{c['subject']} — received {c['received_at']}",
            "ai_confidence_pct": c["ai_finding"]["confidence_pct"],
            "status": "needs_context" if c["ai_finding"]["review_status"] == "needs_context" else "pending_review",
            "reviewer": None,
            "date": c["received_at"],
            "communication_id": c["id"],
        })


_build_reviews()

# ---------------------------------------------------------------------------
# Evidence center
# ---------------------------------------------------------------------------

evidence_entries: list[dict] = [
    {
        "id": "ev-1",
        "finding": "Response exceeded 24-hour target.",
        "source": "Microsoft 365 — Outlook",
        "date": _iso(4),
        "rule": "Customer response target = 24 hours",
        "evidence_text": "Customer email received Monday 09:42. Response sent Tuesday 14:18.",
        "context": "Employee was marked as unavailable (approved PTO).",
        "result": "excluded",
    }
]


def _build_evidence() -> None:
    rng = rng_for("evidence-seed", 7)
    for i, c in enumerate(communications[:9]):
        finding = (
            f"Communication quality scored {c['ai_finding']['quality_score']}/100"
            if c["ai_finding"] else "Response completed within target."
        )
        result = "excluded" if c["excluded"] else ("confirmed" if rng.chance(0.7) else "under_review")
        evidence_entries.append({
            "id": f"ev-gen-{i + 1}",
            "finding": finding,
            "source": "Microsoft 365 — Outlook",
            "date": c["received_at"],
            "rule": "Customer response target = 24 hours" if c["category"] == "customer" else "Internal response target = 48 hours",
            "evidence_text": f"{c['subject']} — received {c['received_at'][:10]}, status: {c['status'].replace('_', ' ')}.",
            "context": "Employee was marked as unavailable (approved PTO)." if c["excluded"] else None,
            "result": result,
        })


_build_evidence()

# ---------------------------------------------------------------------------
# Audit log
# ---------------------------------------------------------------------------

audit_log: list[dict] = [
    {"id": "a1", "timestamp": _iso(0, 9, 12), "user": "Sarah Williams", "action": "Reviewed AI finding", "resource": "Communication comm-7", "result": "success", "ip": "10.20.4.18"},
    {"id": "a2", "timestamp": _iso(0, 8, 3), "user": "System Administrator", "action": "Changed scoring rule", "resource": "Settings / Scoring — Customer response target", "result": "success", "ip": "10.20.1.2"},
    {"id": "a3", "timestamp": _iso(1, 16, 40), "user": "Alex Johnson", "action": "Submitted context", "resource": "Evidence ev-1", "result": "success", "ip": "10.20.6.44"},
    {"id": "a4", "timestamp": _iso(1, 11, 5), "user": "Nelson Bonekeh", "action": "Generated report", "resource": "Monthly Executive Report", "result": "success", "ip": "10.20.1.9"},
    {"id": "a5", "timestamp": _iso(2, 14, 22), "user": "Sarah Williams", "action": "Confirmed AI finding", "resource": "Communication comm-3", "result": "success", "ip": "10.20.4.18"},
    {"id": "a6", "timestamp": _iso(2, 9, 47), "user": "Michael Brown", "action": "Marked follow-up complete", "resource": "Follow-up fu-2", "result": "success", "ip": "10.20.6.51"},
    {"id": "a7", "timestamp": _iso(3, 13, 15), "user": "System Administrator", "action": "Updated exclusion rule", "resource": "Settings / Exclusions — Approved PTO", "result": "success", "ip": "10.20.1.2"},
    {"id": "a8", "timestamp": _iso(4, 10, 2), "user": "Unknown", "action": "Attempted access to Organization Analytics", "resource": "/analytics", "result": "denied", "ip": "10.20.9.201"},
]


def append_audit_entry(user: str, action: str, resource: str, result: str = "success", ip: str = "127.0.0.1") -> dict:
    entry = {
        "id": f"a{len(audit_log) + 1}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "user": user,
        "action": action,
        "resource": resource,
        "result": result,
        "ip": ip,
    }
    audit_log.append(entry)
    return entry
