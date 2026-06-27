import os
import sys
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.core.config import settings
from app.core.database import Base
from app.models.user import (  # noqa: F401
    User, Wallet, Session, EmailVerification, Document,
    LabAnalysis, SymptomAnalysis, HealthTimeline, Medication, AuditLog
)

config = context.config

# Convert to sync psycopg2 URL for Alembic (strip asyncpg dialect + SSL params)
_raw = settings.DATABASE_URL.strip()
for _p in ("?sslmode=disable", "&sslmode=disable", "?sslmode=require", "&sslmode=require"):
    _raw = _raw.replace(_p, "")
db_url = (
    _raw
    .replace("postgresql+asyncpg://", "postgresql://")
    .replace("postgres://", "postgresql://")
)
config.set_main_option("sqlalchemy.url", db_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
