"""
Emora Backend - Users API Router
Provides endpoints for user profile management.

Routes:
  GET    /api/v1/users/me              - Get current user profile
  PUT    /api/v1/users/me              - Update current user profile
  GET    /api/v1/users/me/export       - Export all personal data as JSON
  DELETE /api/v1/users/me              - Delete own account and all data
  GET    /api/v1/users/{user_id}       - Admin/Counselor: get any user by ID
  DELETE /api/v1/users/{user_id}       - Admin only: delete a user
"""

from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_admin, require_counselor_or_admin
from app.core.logging import get_logger
from app.database.connection import get_db_session
from app.models.user import User
from app.schemas.user import UserOut, UserUpdate
from app.services.user_service import UserService

logger = get_logger(__name__)

router = APIRouter(prefix="/users", tags=["Users"])


# ─── Current User Profile ─────────────────────────────────────────────────────

@router.get(
    "/me",
    response_model=UserOut,
    status_code=status.HTTP_200_OK,
    summary="Get current user profile",
    description="Returns the full profile of the currently authenticated user.",
)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
) -> UserOut:
    """Return the authenticated user's profile."""
    logger.info("User profile fetched", user_id=current_user.id)
    return current_user


@router.put(
    "/me",
    response_model=UserOut,
    status_code=status.HTTP_200_OK,
    summary="Update current user profile",
    description=(
        "Updates the authenticated user's profile fields. "
        "Only provided fields are updated (partial update). "
        "If updating password, provide the new password in plain text."
    ),
)
async def update_my_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> UserOut:
    """Partially update the authenticated user's profile."""
    service = UserService(db)
    updated_user = await service.update_user(current_user.id, user_update)
    logger.info("User profile updated", user_id=current_user.id)
    return updated_user


# ─── Self-Service Data Rights ─────────────────────────────────────────────────

@router.get(
    "/me/export",
    status_code=status.HTTP_200_OK,
    summary="Export my personal data",
    description=(
        "Returns a JSON bundle of all personal data for the currently authenticated user: "
        "profile, conversations with messages, mood logs, and journal entries."
    ),
)
async def export_my_data(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> JSONResponse:
    """Export all personal data for the authenticated user as a JSON download."""
    service = UserService(db)
    bundle = await service.export_user_data(current_user.id)
    logger.info("User data exported", user_id=current_user.id)
    return JSONResponse(
        content=bundle,
        headers={"Content-Disposition": f'attachment; filename="emora_data_{current_user.id}.json"'},
    )


@router.delete(
    "/me",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete my account and all data",
    description=(
        "Permanently deletes the authenticated user's account and ALL associated data: "
        "conversations, messages, mood logs, journal entries, and memories. "
        "This action is irreversible."
    ),
)
async def delete_my_account(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> None:
    """Permanently delete the authenticated user's account and all their data."""
    service = UserService(db)
    await service.delete_user(current_user.id)
    logger.info("User account self-deleted", user_id=current_user.id)


# ─── Admin / Counselor Routes ─────────────────────────────────────────────────

@router.get(
    "/{user_id}",
    response_model=UserOut,
    status_code=status.HTTP_200_OK,
    summary="Get user by ID (Admin/Counselor)",
    description="Fetch any user's profile by their ID. Requires Admin or Counselor role.",
    dependencies=[Depends(require_counselor_or_admin)],
)
async def get_user_by_id(
    user_id: int,
    db: AsyncSession = Depends(get_db_session),
) -> UserOut:
    """Fetch a user's profile by ID (Admin/Counselor access only)."""
    service = UserService(db)
    user = await service.get_user_by_id(user_id)
    logger.info("User profile fetched by admin/counselor", target_user_id=user_id)
    return user


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete user by ID (Admin only)",
    description="Permanently deletes a user account by ID. Requires Admin role.",
    dependencies=[Depends(require_admin)],
)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db_session),
) -> None:
    """Delete a user account by ID (Admin only)."""
    service = UserService(db)
    await service.delete_user(user_id)
    logger.info("User account deleted by admin", target_user_id=user_id)
