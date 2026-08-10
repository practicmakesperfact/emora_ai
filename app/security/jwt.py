from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from app.core.config import settings
from app.core.exceptions import AuthenticationException
from app.core.logging import get_logger

logger = get_logger(__name__)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Generate a JWT access token.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    try:
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt
    except JWTError as e:
        logger.error("Failed to generate JWT access token", error=str(e))
        raise AuthenticationException("Could not create access token")

def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Generate a JWT refresh token.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({"exp": expire})
    try:
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt
    except JWTError as e:
        logger.error("Failed to generate JWT refresh token", error=str(e))
        raise AuthenticationException("Could not create refresh token")

def verify_token(token: str) -> Dict[str, Any]:
    """
    Decode and verify a JWT token. Raises AuthenticationException if invalid.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError as e:
        logger.warning("Token verification failed", error=str(e))
        raise AuthenticationException("Could not validate credentials")
