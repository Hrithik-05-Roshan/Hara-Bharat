"""
Activity logging and history endpoints.
Handles daily carbon footprint tracking with category breakdown.
"""

from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from models import Activity, User
from schemas import (
    ActivityLog, ActivityResponse, CategoryBreakdown,
    ActivityHistoryItem, DashboardSummary,
)
from services.carbon_calculator import (
    calculate_transport_co2, calculate_food_co2,
    calculate_energy_co2, calculate_waste_co2,
    calculate_total_co2, get_day_rating,
)
from services.badge_service import check_and_award_badges

router = APIRouter(prefix="/api/activities", tags=["Activities"])


@router.post("/log", response_model=ActivityResponse, status_code=201)
def log_activity(data: ActivityLog, db: Session = Depends(get_db)):
    """
    Log daily carbon footprint activity.
    Calculates CO2 emissions server-side and stores with breakdown.
    Awards badges if conditions are met.
    """
    # Verify user exists
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User nahi mila!")

    # Check for existing log on same date — update if exists
    existing = (
        db.query(Activity)
        .filter(Activity.user_id == data.user_id, Activity.log_date == data.log_date)
        .first()
    )

    # Calculate CO2 per category
    transport_co2 = calculate_transport_co2(
        car_km=data.transport.car_km,
        bike_km=data.transport.bike_km,
        bus_km=data.transport.bus_km,
        train_km=data.transport.train_km,
        auto_km=data.transport.auto_km,
        walk_km=data.transport.walk_km,
    )
    food_co2 = calculate_food_co2(
        nonveg_meals=data.food.nonveg_meals,
        veg_meals=data.food.veg_meals,
        packaged_meals=data.food.packaged_meals,
        homemade_meals=data.food.homemade_meals,
    )
    energy_co2 = calculate_energy_co2(
        ac_hours=data.energy.ac_hours,
        geyser_hours=data.energy.geyser_hours,
        washing_loads=data.energy.washing_loads,
        fan_lights_hours=data.energy.fan_lights_hours,
    )
    waste_co2 = calculate_waste_co2(
        plastic_items=data.waste.plastic_items,
        delivery_orders=data.waste.delivery_orders,
        recycling_done=data.waste.recycling_done,
    )
    total_co2 = calculate_total_co2(transport_co2, food_co2, energy_co2, waste_co2)

    if existing:
        # Update existing log
        existing.transport_car_km = data.transport.car_km
        existing.transport_bike_km = data.transport.bike_km
        existing.transport_bus_km = data.transport.bus_km
        existing.transport_train_km = data.transport.train_km
        existing.transport_auto_km = data.transport.auto_km
        existing.transport_walk_km = data.transport.walk_km
        existing.food_nonveg_meals = data.food.nonveg_meals
        existing.food_veg_meals = data.food.veg_meals
        existing.food_packaged_meals = data.food.packaged_meals
        existing.food_homemade_meals = data.food.homemade_meals
        existing.energy_ac_hours = data.energy.ac_hours
        existing.energy_geyser_hours = data.energy.geyser_hours
        existing.energy_washing_loads = data.energy.washing_loads
        existing.energy_fan_lights_hours = data.energy.fan_lights_hours
        existing.waste_plastic_items = data.waste.plastic_items
        existing.waste_delivery_orders = data.waste.delivery_orders
        existing.waste_recycling_done = data.waste.recycling_done
        existing.transport_co2 = transport_co2
        existing.food_co2 = food_co2
        existing.energy_co2 = energy_co2
        existing.waste_co2 = waste_co2
        existing.total_kg_co2 = total_co2
        db.commit()
        db.refresh(existing)
        activity = existing
    else:
        # Create new log
        activity = Activity(
            user_id=data.user_id,
            log_date=data.log_date,
            transport_car_km=data.transport.car_km,
            transport_bike_km=data.transport.bike_km,
            transport_bus_km=data.transport.bus_km,
            transport_train_km=data.transport.train_km,
            transport_auto_km=data.transport.auto_km,
            transport_walk_km=data.transport.walk_km,
            food_nonveg_meals=data.food.nonveg_meals,
            food_veg_meals=data.food.veg_meals,
            food_packaged_meals=data.food.packaged_meals,
            food_homemade_meals=data.food.homemade_meals,
            energy_ac_hours=data.energy.ac_hours,
            energy_geyser_hours=data.energy.geyser_hours,
            energy_washing_loads=data.energy.washing_loads,
            energy_fan_lights_hours=data.energy.fan_lights_hours,
            waste_plastic_items=data.waste.plastic_items,
            waste_delivery_orders=data.waste.delivery_orders,
            waste_recycling_done=data.waste.recycling_done,
            transport_co2=transport_co2,
            food_co2=food_co2,
            energy_co2=energy_co2,
            waste_co2=waste_co2,
            total_kg_co2=total_co2,
        )
        db.add(activity)
        db.commit()
        db.refresh(activity)

    # Check and award badges
    check_and_award_badges(db, data.user_id)

    return ActivityResponse(
        activity_id=activity.id,
        log_date=activity.log_date,
        total_kg_co2=total_co2,
        category_breakdown=CategoryBreakdown(
            transport=transport_co2,
            food=food_co2,
            energy=energy_co2,
            waste=waste_co2,
        ),
        day_rating=get_day_rating(total_co2),
    )


@router.get("/{user_id}/today", response_model=ActivityResponse)
def get_today_activity(user_id: str, db: Session = Depends(get_db)):
    """Get today's activity log for a user."""
    activity = (
        db.query(Activity)
        .filter(Activity.user_id == user_id, Activity.log_date == date.today())
        .first()
    )

    if not activity:
        # Return empty activity for today
        return ActivityResponse(
            activity_id="",
            log_date=date.today(),
            total_kg_co2=0.0,
            category_breakdown=CategoryBreakdown(
                transport=0.0, food=0.0, energy=0.0, waste=0.0,
            ),
            day_rating="green",
        )

    return ActivityResponse(
        activity_id=activity.id,
        log_date=activity.log_date,
        total_kg_co2=activity.total_kg_co2,
        category_breakdown=CategoryBreakdown(
            transport=activity.transport_co2,
            food=activity.food_co2,
            energy=activity.energy_co2,
            waste=activity.waste_co2,
        ),
        day_rating=get_day_rating(activity.total_kg_co2),
    )


@router.get("/{user_id}/history", response_model=list[ActivityHistoryItem])
def get_activity_history(
    user_id: str,
    days: int = Query(default=30, ge=1, le=365),
    db: Session = Depends(get_db),
):
    """Get activity history for the past N days (default 30, max 365)."""
    start_date = date.today() - timedelta(days=days)

    activities = (
        db.query(Activity)
        .filter(
            Activity.user_id == user_id,
            Activity.log_date >= start_date,
        )
        .order_by(Activity.log_date.asc())
        .limit(365)
        .all()
    )

    return [
        ActivityHistoryItem(
            log_date=a.log_date,
            total_kg_co2=a.total_kg_co2,
            transport_co2=a.transport_co2,
            food_co2=a.food_co2,
            energy_co2=a.energy_co2,
            waste_co2=a.waste_co2,
        )
        for a in activities
    ]


@router.get("/dashboard/{user_id}/summary", response_model=DashboardSummary)
def get_dashboard_summary(user_id: str, db: Session = Depends(get_db)):
    """
    Get dashboard summary including today's score,
    weekly average, streak, XP, and badge count.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User nahi mila!")

    # Today's score
    today_activity = (
        db.query(Activity)
        .filter(Activity.user_id == user_id, Activity.log_date == date.today())
        .first()
    )
    today_score = today_activity.total_kg_co2 if today_activity else 0.0

    # Weekly average
    week_start = date.today() - timedelta(days=7)
    week_activities = (
        db.query(Activity)
        .filter(
            Activity.user_id == user_id,
            Activity.log_date >= week_start,
        )
        .all()
    )
    week_avg = (
        sum(a.total_kg_co2 for a in week_activities) / len(week_activities)
        if week_activities
        else 0.0
    )

    # Green streak (consecutive days below 5kg)
    all_activities = (
        db.query(Activity)
        .filter(Activity.user_id == user_id)
        .order_by(Activity.log_date.desc())
        .all()
    )
    streak_days = 0
    for a in all_activities:
        if a.total_kg_co2 < 5.0:
            streak_days += 1
        else:
            break

    # Badges count
    from models import Badge
    badges_count = (
        db.query(Badge).filter(Badge.user_id == user_id).count()
    )

    # Challenges completed today
    from models import Challenge
    challenges_completed = (
        db.query(Challenge)
        .filter(
            Challenge.user_id == user_id,
            Challenge.challenge_date == date.today(),
            Challenge.is_completed == True,
        )
        .count()
    )

    return DashboardSummary(
        today_score=round(today_score, 2),
        week_avg=round(week_avg, 2),
        streak_days=streak_days,
        total_xp=user.xp or 0,
        badges_count=badges_count,
        challenges_completed_today=challenges_completed,
        day_rating=get_day_rating(today_score),
    )
