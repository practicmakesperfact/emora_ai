"""
Emora Backend - Authentication Service
Handles user registration, login credential verification,
JWT access/refresh token creation, and token refresh logic.
"""

from datetime import timedelta
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import AuthenticationException, ValidationException
from app.core.logging import get_logger
from app.models.user import User, Role
from app.repositories.user import UserRepository
from app.schemas.auth import Token
from app.schemas.user import UserCreate
from app.security.jwt import create_access_token, create_refresh_token, verify_token
from app.security.password import hash_password, verify_password

logger = get_logger(__name__)


class AuthService:
    """
    Service handling all authentication-related business logic.
    Follows the Service Layer Pattern for clean separation of concerns.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repository = UserRepository(db)

    # ─── Registration ─────────────────────────────────────────────────────────

    async def register_user(self, user_data: UserCreate) -> User:
        """
        Register a new user account.

        Steps:
        1. Check if email is already in use.
        2. Resolve (or create) the requested role.
        3. Hash the password.
        4. Persist the new user.

        Args:
            user_data: Validated registration payload.

        Returns:
            Newly created User ORM object.

        Raises:
            ValidationException: If email is already registered.
        """
        # 1. Email uniqueness check
        existing = await self.repository.get_by_email(user_data.email)
        if existing:
            raise ValidationException("An account with this email already exists.")

        # 2. Resolve role
        role = await self.repository.get_role_by_name(user_data.role_name)
        if not role:
            # Fall back to 'User' role if an unknown role name is provided
            role = await self.repository.get_role_by_name("User")
        if not role:
            raise ValidationException(
                "Default role 'User' does not exist. Please run database seeding."
            )

        # 3. Create user
        new_user = User(
            full_name=user_data.full_name,
            email=user_data.email,
            hashed_password=hash_password(user_data.password),
            preferred_language=user_data.preferred_language,
            time_zone=user_data.time_zone,
            mental_wellness_goal=user_data.mental_wellness_goal,
            emergency_contact=user_data.emergency_contact,
            role_id=role.id,
        )

        created_user = await self.repository.create(new_user)
        logger.info("User registered", user_id=created_user.id, email=created_user.email)
        return created_user

    # ─── Login ────────────────────────────────────────────────────────────────

    async def authenticate_user(self, email: str, password: str) -> User:
        """
        Verify email/password credentials.

        Args:
            email: User's email address.
            password: Plain-text password.

        Returns:
            Authenticated User ORM object.

        Raises:
            AuthenticationException: If credentials are invalid.
        """
        user = await self.repository.get_by_email(email)
        if not user:
            logger.warning("Login attempt with unknown email", email=email)
            raise AuthenticationException("Invalid email or password.")

        if not verify_password(password, user.hashed_password):
            logger.warning("Login attempt with wrong password", user_id=user.id)
            raise AuthenticationException("Invalid email or password.")

        logger.info("User authenticated", user_id=user.id)
        return user

    # ─── Token Generation ─────────────────────────────────────────────────────

    def generate_tokens(self, user: User) -> Token:
        """
        Build access and refresh JWT tokens for the given user.

        Args:
            user: Authenticated User ORM object.

        Returns:
            Token schema containing access_token, refresh_token, and token_type.
        """
        role_name = user.role.name if user.role else "User"

        token_data = {
            "sub": str(user.id),
            "email": user.email,
            "role": role_name,
        }

        access_token = create_access_token(
            data=token_data,
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        )
        refresh_token = create_refresh_token(
            data=token_data,
            expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )

        logger.info("Tokens generated", user_id=user.id)
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
        )

    # ─── Token Refresh ────────────────────────────────────────────────────────

    async def refresh_access_token(self, refresh_token: str) -> Token:
        """
        Validate a refresh token and issue a new access + refresh token pair.

        Args:
            refresh_token: A valid JWT refresh token string.

        Returns:
            New Token schema with fresh tokens.

        Raises:
            AuthenticationException: If the refresh token is invalid or user not found.
        """
        # Decode and validate the refresh token
        payload = verify_token(refresh_token)
        user_id: Optional[str] = payload.get("sub")

        if not user_id:
            raise AuthenticationException("Invalid refresh token payload.")

        user = await self.repository.get_by_id(int(user_id))
        if not user:
            raise AuthenticationException("User associated with this token no longer exists.")

        logger.info("Access token refreshed", user_id=user.id)
        return self.generate_tokens(user)
