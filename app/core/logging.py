"""
Emora Backend - Structlog Logging Setup
Provides structured JSON logging with context binding.
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
    """
    log_level = logging.DEBUG if debug else logging.INFO

    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=log_level,
    )

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
