"""
Database configuration and session management for HaraBharat.
Uses SQLAlchemy async-compatible setup with SQLite.
"""

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase

DATABASE_URL = "sqlite:///./harabharat.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)


from typing import Any, Generator
from sqlalchemy.orm import Session

@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection: Any, _connection_record: Any) -> None:
    """
    Enable WAL mode and foreign keys for better SQLite performance.

    Args:
        dbapi_connection: The connection object.
        _connection_record: The connection record.

    Returns:
        None
    """
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Declarative base class for all ORM models."""
    pass


def get_db() -> Generator[Session, None, None]:
    """
    Dependency that provides a database session per request.

    Returns:
        Generator yielding a database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """
    Create all database tables.

    Returns:
        None
    """
    import models
    Base.metadata.create_all(bind=engine)
