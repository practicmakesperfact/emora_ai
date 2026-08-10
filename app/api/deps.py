"""
Emora Backend - FastAPI Dependency Injection Helpers
Provides reusable dependencies for:
  - Extracting and validating the current authenticated user from JWT
  - Role-based access control guards
"""

from typing import List

from fastapi import Depends, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthenticationException, AuthorizationException
from app.core.logging import get_logger
from app.database.connection import get_db_session
from app.models.user import User
from app.repositories.user import UserRepository
from app.security.jwt import verify_token

logger = get_logger(__name__)

# OAuth2 Bearer token scheme — reads Authorization: Bearer <token> header
bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(bearer_scheme),
    db: AsyncSession = Depends(get_db_session),
) -> User:
    """
    FastAPI dependency that:
    1. Extracts the Bearer token from the Authorization header.
    2. Verifies the JWT signature and expiry.
    3. Fetches and returns the corresponding User from the database.

    Raises:
        AuthenticationException: If token is missing, invalid, or user not found.
    """
    if not credentials or not credentials.credentials:
        raise AuthenticationException("Authorization token is required.")

    payload = verify_token(credentials.credentials)

    user_id_str: str | None = payload.get("sub")
    if not user_id_str:
        raise AuthenticationException("Token payload is missing subject (sub).")

    try:
        user_id = int(user_id_str)
    except ValueError:
        raise AuthenticationException("Token subject is not a valid user ID.")

    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if not user:
        raise AuthenticationException("User associated with this token was not found.")

    logger.debug("Authenticated user from token", user_id=user.id, role=user.role.name if user.role else "N/A")
    return user


# ─── Role-Based Access Control ────────────────────────────────────────────────

class RoleChecker:
    """
    Callable dependency class that restricts endpoint access to specific roles.

    Usage:
        @router.get("/admin-only", dependencies=[Depends(RoleChecker(["Admin"]))])
    """

    def __init__(self, allowed_roles: List[str]) -> None:
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        """
        Verify the current user's role is in the allowed roles list.

        Args:
            current_user: Injected current authenticated user.

        Returns:
            The current_user if authorized.

        Raises:
            AuthorizationException: If the user does not have a permitted role.
        """
        user_role = current_user.role.name if current_user.role else None
        if user_role not in self.allowed_roles:
            logger.warning(
                "Access denied: insufficient role",
                user_id=current_user.id,
                user_role=user_role,
                required_roles=self.allowed_roles,
            )
            raise AuthorizationException(
                f"Access denied. Required role(s): {', '.join(self.allowed_roles)}."
            )
        return current_user


# ─── Pre-built Role Guards ─────────────────────────────────────────────────────

# Use as Depends() argument in endpoint definitions:
#   Depends(require_admin)
#   Depends(require_counselor_or_admin)

require_admin = RoleChecker(["Admin"])
require_counselor_or_admin = RoleChecker(["Counselor", "Admin"])
require_any_role = RoleChecker(["User", "Counselor", "Admin"])
