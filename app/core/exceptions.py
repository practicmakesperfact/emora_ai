from typing import Any, Dict, Optional

class AppException(Exception):
    """Base application exception."""
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        details: Optional[Any] = None
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details

class NotFoundException(AppException):
    """Resource not found exception."""
    def __init__(self, message: str, details: Optional[Any] = None):
        super().__init__(message, status_code=404, details=details)

class AuthenticationException(AppException):
    """Authentication failed exception."""
    def __init__(self, message: str = "Could not validate credentials", details: Optional[Any] = None):
        super().__init__(message, status_code=401, details=details)

class AuthorizationException(AppException):
    """Authorization failed exception."""
    def __init__(self, message: str = "Permission denied", details: Optional[Any] = None):
        super().__init__(message, status_code=403, details=details)

class ValidationException(AppException):
    """Input validation failed exception."""
    def __init__(self, message: str, details: Optional[Any] = None):
        super().__init__(message, status_code=422, details=details)

class CrisisDetectedException(AppException):
    """Mental health crisis detected exception."""
    def __init__(self, message: str, severity: str, details: Optional[Any] = None):
        super().__init__(message, status_code=400, details={"severity": severity, "details": details})

class GuardrailException(AppException):
    """Guardrail policy violation exception."""
    def __init__(self, message: str, rule: str, details: Optional[Any] = None):
        super().__init__(message, status_code=400, details={"rule": rule, "details": details})
