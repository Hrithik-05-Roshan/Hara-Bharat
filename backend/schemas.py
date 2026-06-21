"""
Pydantic v2 schemas for request/response validation.
All inputs are strictly validated with length limits and value constraints.
"""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


# ─── User Schemas ───

class UserRegister(BaseModel):
    """Registration request — name, city, and 4-digit PIN."""

    name: str = Field(..., min_length=1, max_length=50, description="User ka naam")
    city: str = Field(..., min_length=1, max_length=100, description="User ka city")
    pin: str = Field(..., min_length=4, max_length=4, description="4-digit PIN")

    @field_validator("pin")
    @classmethod
    def pin_must_be_digits(cls, v: str) -> str:
        """
        Validate that the PIN contains only digits.

        Args:
            v: The PIN string value.

        Returns:
            The validated PIN string.
        """
        if not v.isdigit():
            raise ValueError("PIN mein sirf numbers hone chahiye")
        return v

    @field_validator("name")
    @classmethod
    def name_must_be_clean(cls, v: str) -> str:
        """
        Ensure the user name is not empty or containing only whitespace.

        Args:
            v: The user name string.

        Returns:
            The cleaned user name string.
        """
        v = v.strip()
        if not v:
            raise ValueError("Naam khali nahi ho sakta")
        return v


class UserLogin(BaseModel):
    """Login request — name and PIN to restore session."""

    name: str = Field(..., min_length=1, max_length=50)
    pin: str = Field(..., min_length=4, max_length=4)

    @field_validator("pin")
    @classmethod
    def pin_must_be_digits(cls, v: str) -> str:
        """
        Validate that the PIN contains only digits.

        Args:
            v: The PIN string value.

        Returns:
            The validated PIN string.
        """
        if not v.isdigit():
            raise ValueError("PIN mein sirf numbers hone chahiye")
        return v


class UserResponse(BaseModel):
    """User data returned after registration/login."""

    user_id: str
    name: str
    city: str
    xp: int = 0
    message: str = "Swagat hai!"

    model_config = {"from_attributes": True}


# ─── Activity Schemas ───

class TransportInput(BaseModel):
    """Transport category inputs in km."""

    car_km: float = Field(default=0.0, ge=0, le=1000)
    bike_km: float = Field(default=0.0, ge=0, le=1000)
    bus_km: float = Field(default=0.0, ge=0, le=1000)
    train_km: float = Field(default=0.0, ge=0, le=5000)
    auto_km: float = Field(default=0.0, ge=0, le=500)
    walk_km: float = Field(default=0.0, ge=0, le=100)


class FoodInput(BaseModel):
    """Food category inputs in meal counts."""

    nonveg_meals: int = Field(default=0, ge=0, le=10)
    veg_meals: int = Field(default=0, ge=0, le=10)
    packaged_meals: int = Field(default=0, ge=0, le=10)
    homemade_meals: int = Field(default=0, ge=0, le=10)


class EnergyInput(BaseModel):
    """Home energy category inputs."""

    ac_hours: float = Field(default=0.0, ge=0, le=24)
    geyser_hours: float = Field(default=0.0, ge=0, le=24)
    washing_loads: int = Field(default=0, ge=0, le=10)
    fan_lights_hours: float = Field(default=0.0, ge=0, le=24)


class WasteInput(BaseModel):
    """Waste category inputs."""

    plastic_items: int = Field(default=0, ge=0, le=100)
    delivery_orders: int = Field(default=0, ge=0, le=20)
    recycling_done: bool = Field(default=False)


class ActivityLog(BaseModel):
    """Complete daily activity log submission."""

    user_id: str = Field(..., min_length=36, max_length=36)
    log_date: date = Field(default_factory=date.today)
    transport: TransportInput = Field(default_factory=TransportInput)
    food: FoodInput = Field(default_factory=FoodInput)
    energy: EnergyInput = Field(default_factory=EnergyInput)
    waste: WasteInput = Field(default_factory=WasteInput)


class CategoryBreakdown(BaseModel):
    """CO2 breakdown by category."""

    transport: float
    food: float
    energy: float
    waste: float


class ActivityResponse(BaseModel):
    """Response after logging an activity."""

    activity_id: str
    log_date: date
    total_kg_co2: float
    category_breakdown: CategoryBreakdown
    day_rating: str  # "green", "yellow", "red"

    model_config = {"from_attributes": True}


class ActivityHistoryItem(BaseModel):
    """Single activity entry in history list."""

    log_date: date
    total_kg_co2: float
    transport_co2: float
    food_co2: float
    energy_co2: float
    waste_co2: float

    model_config = {"from_attributes": True}


# ─── Chat Schemas ───

class ChatRequest(BaseModel):
    """Chat message to Eco Mitra."""

    user_id: str = Field(..., min_length=36, max_length=36)
    message: str = Field(..., min_length=1, max_length=500)
    user_context: Optional[str] = Field(default=None, max_length=5000)


class ChatResponse(BaseModel):
    """Chat response from Eco Mitra."""

    reply: str
    intent: str = "chat"
    show_confirmation: bool = False
    pending_activities: Optional[dict] = None
    user_context: Optional[str] = None



# ─── Challenge Schemas ───

class ChallengeResponse(BaseModel):
    """A single daily challenge."""

    id: str
    challenge_text: str
    category: str
    co2_saving_kg: float
    is_completed: bool

    model_config = {"from_attributes": True}


# ─── Badge Schemas ───

class BadgeResponse(BaseModel):
    """A single badge."""

    badge_key: str
    badge_name: str
    badge_emoji: str
    badge_description: str
    earned_at: Optional[datetime] = None
    is_unlocked: bool = False

    model_config = {"from_attributes": True}


# ─── Dashboard Schemas ───

class DashboardSummary(BaseModel):
    """Dashboard overview data."""

    today_score: float
    week_avg: float
    streak_days: int
    total_xp: int
    badges_count: int
    challenges_completed_today: int
    day_rating: str


# ─── Weekly Report Schemas ───

class WeeklyReportResponse(BaseModel):
    """Weekly AI insight report."""

    week_start: date
    week_end: date
    report_text: str
    total_co2: float
    best_day_co2: Optional[float]
    worst_day_co2: Optional[float]

    model_config = {"from_attributes": True}
