"""
Emora Backend - Crisis API Router

Routes:
  GET  /api/v1/crisis/incidents                          - List all crisis incidents (Counselor/Admin)
  GET  /api/v1/crisis/incidents/{incident_id}            - Get a specific incident (Counselor/Admin)
  PUT  /api/v1/crisis/incidents/{incident_id}/resolve    - Resolve an incident (Counselor/Admin)

All endpoints require Counselor or Admin role.
"""

from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_counselor_or_admin
from app.core.logging import get_logger
from app.database.connection import get_db_session
from app.schemas.crisis import IncidentOut, IncidentResolve
from app.services.crisis_service import CrisisService

logger = get_logger(__name__)

router = APIRouter(
    prefix="/crisis",
    tags=["Crisis"],
    dependencies=[Depends(require_counselor_or_admin)],
)


@router.get(
    "/incidents",
    response_model=List[IncidentOut],
    status_code=status.HTTP_200_OK,
    summary="List all crisis incidents",
    description="Retrieve all logged crisis incidents for review. Requires Counselor or Admin role.",
)
async def list_incidents(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: AsyncSession = Depends(get_db_session),
) -> List[IncidentOut]:
    """List all crisis incidents for counselor review."""
    service = CrisisService(db)
    incidents = await service.list_incidents(skip=skip, limit=limit)
    return list(incidents)


@router.get(
    "/incidents/{incident_id}",
    response_model=IncidentOut,
    status_code=status.HTTP_200_OK,
    summary="Get a crisis incident by ID",
    description="Fetch details of a specific crisis incident. Requires Counselor or Admin role.",
)
async def get_incident(
    incident_id: int,
    db: AsyncSession = Depends(get_db_session),
) -> IncidentOut:
    """Retrieve a specific crisis incident."""
    service = CrisisService(db)
    return await service.get_incident(incident_id)


@router.put(
    "/incidents/{incident_id}/resolve",
    response_model=IncidentOut,
    status_code=status.HTTP_200_OK,
    summary="Resolve a crisis incident",
    description="Mark a crisis incident as resolved with optional counselor notes.",
)
async def resolve_incident(
    incident_id: int,
    payload: IncidentResolve,
    db: AsyncSession = Depends(get_db_session),
) -> IncidentOut:
    """Resolve a crisis incident and add optional counselor notes."""
    service = CrisisService(db)
    return await service.resolve_incident(
        incident_id=incident_id,
        counselor_notes=payload.counselor_notes,
    )
