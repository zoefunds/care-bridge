from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings


def _build_db_url(raw: str) -> tuple[str, dict]:
    """
    Normalize a database URL for asyncpg.

    Fly Postgres attach produces: postgresql://user:pass@host/db?sslmode=disable
    asyncpg needs:                postgresql+asyncpg://user:pass@host/db
    with ssl handled via connect_args, not the URL query string.
    """
    url = raw.strip()

    # Strip any existing query params that asyncpg doesn't understand
    for param in ("?sslmode=disable", "&sslmode=disable", "?sslmode=require", "&sslmode=require"):
        url = url.replace(param, "")

    # Ensure asyncpg dialect prefix
    if url.startswith("postgresql://") or url.startswith("postgres://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)

    # Fly internal (flycast) connections don't need SSL; external ones might.
    # Disable SSL for internal Fly Postgres — avoids handshake reset errors.
    connect_args: dict = {"ssl": False}

    return url, connect_args


_db_url, _connect_args = _build_db_url(settings.DATABASE_URL)

engine = create_async_engine(
    _db_url,
    echo=settings.APP_ENV == "development",
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    connect_args=_connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
