"""
SQLAlchemy ORM models for HaraBharat.
All models use UUID primary keys and have proper indexes for query performance.
"""

import uuid
from datetime import datetime, date

from sqlalchemy import (
    Column, String, Float, Integer, Boolean, Date,
    DateTime, Text, ForeignKey, Index
)
from sqlalchemy.orm import relationship

from database import Base


def generate_uuid() -> str:
    """
    Generate a new UUID4 string.

    Returns:
        A unique UUID4 string.
    """
    return str(uuid.uuid4())


class User(Base):
    """User model — lightweight onboarding with name, city, and hashed PIN."""

    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(50), nullable=False, index=True)
    city = Column(String(100), nullable=False)
    pin_hash = Column(String(128), nullable=False)
    xp = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    activities = relationship("Activity", back_populates="user", cascade="all, delete-orphan")
    badges = relationship("Badge", back_populates="user", cascade="all, delete-orphan")
    challenges = relationship("Challenge", back_populates="user", cascade="all, delete-orphan")
    weekly_reports = relationship("WeeklyReport", back_populates="user", cascade="all, delete-orphan")


class Activity(Base):
    """Daily carbon activity log with breakdown across 4 categories."""

    __tablename__ = "activities"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    log_date = Column(Date, nullable=False, default=date.today)

    # Transport (km values)
    transport_car_km = Column(Float, default=0.0)
    transport_bike_km = Column(Float, default=0.0)
    transport_bus_km = Column(Float, default=0.0)
    transport_train_km = Column(Float, default=0.0)
    transport_auto_km = Column(Float, default=0.0)
    transport_walk_km = Column(Float, default=0.0)

    # Food (meal counts)
    food_nonveg_meals = Column(Integer, default=0)
    food_veg_meals = Column(Integer, default=0)
    food_packaged_meals = Column(Integer, default=0)
    food_homemade_meals = Column(Integer, default=0)

    # Energy (hours/loads)
    energy_ac_hours = Column(Float, default=0.0)
    energy_geyser_hours = Column(Float, default=0.0)
    energy_washing_loads = Column(Integer, default=0)
    energy_fan_lights_hours = Column(Float, default=0.0)

    # Waste
    waste_plastic_items = Column(Integer, default=0)
    waste_delivery_orders = Column(Integer, default=0)
    waste_recycling_done = Column(Boolean, default=False)

    # Calculated totals
    total_kg_co2 = Column(Float, default=0.0)
    transport_co2 = Column(Float, default=0.0)
    food_co2 = Column(Float, default=0.0)
    energy_co2 = Column(Float, default=0.0)
    waste_co2 = Column(Float, default=0.0)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="activities")

    __table_args__ = (
        Index("ix_activity_user_date", "user_id", "log_date"),
        Index("ix_activity_date", "log_date"),
    )


class Badge(Base):
    """Gamification badges earned by users."""

    __tablename__ = "badges"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    badge_key = Column(String(50), nullable=False)
    badge_name = Column(String(100), nullable=False)
    badge_emoji = Column(String(10), nullable=False)
    badge_description = Column(String(255), nullable=False)
    earned_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="badges")

    __table_args__ = (
        Index("ix_badge_user", "user_id"),
    )


class Challenge(Base):
    """Daily eco challenges assigned to users."""

    __tablename__ = "challenges"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    challenge_date = Column(Date, nullable=False, default=date.today)
    challenge_text = Column(Text, nullable=False)
    category = Column(String(30), nullable=False)
    co2_saving_kg = Column(Float, default=0.0)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="challenges")

    __table_args__ = (
        Index("ix_challenge_user_date", "user_id", "challenge_date"),
    )


class WeeklyReport(Base):
    """AI-generated weekly sustainability reports."""

    __tablename__ = "weekly_reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    week_start = Column(Date, nullable=False)
    week_end = Column(Date, nullable=False)
    report_text = Column(Text, nullable=False)
    total_co2 = Column(Float, default=0.0)
    best_day_co2 = Column(Float, nullable=True)
    worst_day_co2 = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="weekly_reports")

    __table_args__ = (
        Index("ix_report_user", "user_id"),
    )
