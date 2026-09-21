from fastapi import APIRouter

from app.api.v1.routes import (
    alerts,
    analytics,
    coaching,
    commitments,
    communication,
    customers,
    dashboard,
    evidence,
    followups,
    organization,
    outlook,
    performance,
    reports,
    reviews,
    settings,
    team,
)

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(dashboard.router)
api_router.include_router(communication.router)
api_router.include_router(commitments.router)
api_router.include_router(followups.router)
api_router.include_router(alerts.router)
api_router.include_router(performance.router)
api_router.include_router(coaching.router)
api_router.include_router(evidence.router)
api_router.include_router(reviews.router)
api_router.include_router(team.router)
api_router.include_router(customers.router)
api_router.include_router(organization.router)
api_router.include_router(reports.router)
api_router.include_router(analytics.router)
api_router.include_router(outlook.router)
api_router.include_router(settings.router)
