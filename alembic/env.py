"""
Alembic Environment Configuration for Emora Backend
Supports async migrations using asyncpg + SQLAlchemy 2.0.
"""

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy.ext.asyncio import create_async_engine

# Import all models so Base.metadata is fully populated
from app.core.config import settings
from app.database.base import Base

# Import all models (must happen BEFORE target_metadata is set)
import app.models  # noqa: F401 - registers all ORM models

# Alembic config object (gives access to values within alembic.ini)
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Target metadata for autogenerate support
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """
    Run migrations in 'offline' mode.
    Configures context with just a URL (no Engine connection needed).
    Useful for generating SQL scripts.
    """
    url = settings.DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection) -> None:
    """Run actual migration commands against a live database connection."""
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """
    Create an async engine and run migrations using a synchronous connection.
    Alembic does not natively support async, so we use run_sync().
    """
    connectable = create_async_engine(settings.DATABASE_URL, echo=False)

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Entry point for online (live DB) migrations."""
    asyncio.run(run_async_migrations())


# ─── Entry Point ──────────────────────────────────────────────────────────────
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
