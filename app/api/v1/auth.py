"""
Emora Backend - Authentication API Router
Provides endpoints for user registration, login, and token refresh.

Routes:
  POST /api/v1/auth/register  - Create a new user account
  POST /api/v1/auth/login     - Authenticate and receive JWT tokens
  POST /api/v1/auth/refresh   - Exchange a refresh token for a new token pair
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.database.connection import get_db_session
from app.schemas.auth import LoginRequest, Token
from app.schemas.user import UserCreate, UserOut
from app.services.auth_service import AuthService

logger = get_logger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ─── Register ─────────────────────────────────────────────────────────────────

@router.post(
    "/register",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
    description=(
        "Creates a new user account with the provided details. "
        "The role defaults to 'User' unless specified. "
        "Returns the created user profile (without the password)."
    ),
)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db_session),
) -> UserOut:
    """Register a new user and return their profile."""
    service = AuthService(db)
    user = await service.register_user(user_data)
    logger.info("New user registered via API", user_id=user.id)
    return user


# ─── Login ────────────────────────────────────────────────────────────────────

@router.post(
    "/login",
    response_model=Token,
    status_code=status.HTTP_200_OK,
    summary="Login and receive JWT tokens",
    description=(
        "Authenticates a user with their email and password. "
        "Returns an access token (short-lived) and a refresh token (long-lived)."
    ),
)
async def login(
    credentials: LoginRequest,
    db: AsyncSession = Depends(get_db_session),
) -> Token:
    """Validate credentials and return access + refresh tokens."""
    service = AuthService(db)
    user = await service.authenticate_user(
        email=credentials.email,
        password=credentials.password,
    )
    tokens = service.generate_tokens(user)
    logger.info("User logged in via API", user_id=user.id)
    return tokens


# ─── Token Refresh ────────────────────────────────────────────────────────────

@router.post(
    "/refresh",
    response_model=Token,
    status_code=status.HTTP_200_OK,
    summary="Refresh JWT tokens",
    description=(
        "Validates a refresh token and issues a new access + refresh token pair. "
        "Use this when the access token expires to avoid re-login."
    ),
)
async def refresh_token(
    refresh_token: str,
    db: AsyncSession = Depends(get_db_session),
) -> Token:
    """Accept a refresh token and return a fresh token pair."""
    service = AuthService(db)
    tokens = await service.refresh_access_token(refresh_token)
    logger.info("Tokens refreshed via API")
    return tokens
