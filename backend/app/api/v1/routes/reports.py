from fastapi import APIRouter

from app.services import reports_service

router = APIRouter(tags=["reports"])


@router.get("/reports")
def list_reports():
    return reports_service.list_reports()
