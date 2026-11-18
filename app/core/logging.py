"""
Emora Backend - Structlog Logging Setup
Provides structured logging with context binding.
Filters out verbose SQLAlchemy and HTTP logs in production.
"""

import logging
import sys
from typing import Any

import structlog


def setup_logging(debug: bool = False) -> None:
    """
    Configure structlog for structured logging.

    Args:
        debug: If True, enables DEBUG level logging with pretty output.
               If False, sets WARNING level (production mode).
    """
    # Production: Only warnings and errors
    # Development: Show everything (DEBUG level)
    log_level = logging.DEBUG if debug else logging.WARNING

    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=log_level,
    )

    # Silence verbose libraries in production
    if not debug:
        # SQLAlchemy query logging - only show warnings
        logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
        logging.getLogger("sqlalchemy.pool").setLevel(logging.WARNING)
        logging.getLogger("sqlalchemy.dialects").setLevel(logging.WARNING)
        
        # Uvicorn access logs - only show warnings
        logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
        logging.getLogger("uvicorn.error").setLevel(logging.INFO)  # Keep error logs
        
        # FastAPI - only show warnings
        logging.getLogger("fastapi").setLevel(logging.WARNING)

    # Processors applied to every log entry
    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
    ]

    if debug:
        # Pretty colored output for development
        processors = shared_processors + [
            structlog.dev.ConsoleRenderer(colors=True)
        ]
    else:
        # JSON output for production-like logging
        processors = shared_processors + [
            structlog.processors.JSONRenderer()
        ]

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str = "emora") -> Any:
    """
    Get a bound structlog logger.

    Args:
        name: Logger name (usually __name__ of the module).

    Returns:
        A bound structlog logger instance.
    """
    return structlog.get_logger(name)

