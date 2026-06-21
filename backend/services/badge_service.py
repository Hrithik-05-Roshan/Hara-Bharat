"""
Badge service — gamification logic for HaraBharat.
Awards badges based on user activity patterns.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from models import Badge, Activity, User


# ─── Badge Definitions ───

BADGE_DEFINITIONS = {
    "seedha_shuruaat": {
        "name": "Seedha Seedha Shuruaat",
        "emoji": "🌱",
        "description": "Pehla carbon log enter kiya — shuruaat ho gayi!",
    },
    "paidal_hero": {
        "name": "Paidal Hero",
        "emoji": "🚶",
        "description": "5 din paidal ya cycle se chale — respect!",
    },
    "veg_warrior": {
        "name": "Veg Warrior",
        "emoji": "🍃",
        "description": "7 consecutive din veg khana khaya — kamaal!",
    },
    "bijli_bachao": {
        "name": "Bijli Bachao Champion",
        "emoji": "⚡",
        "description": "5 din AC 2 ghante se kam chalaya — energy saver!",
    },
    "carbon_crusher": {
        "name": "Carbon Crusher",
        "emoji": "🌍",
        "description": "30 din streak below 5kg/day — legend!",
    },
    "harabharat_legend": {
        "name": "HaraBharat Legend",
        "emoji": "🏆",
        "description": "100 din logged — aap sachche eco warrior hain!",
    },
}


def get_all_badge_definitions() -> list[dict]:
    """
    Return all badge definitions with unlocked status defaulting to False.

    Returns:
        List of dictionaries representing badge definitions.
    """
    result = []
    for key, badge_def in BADGE_DEFINITIONS.items():
        result.append({
            "badge_key": key,
            "badge_name": badge_def["name"],
            "badge_emoji": badge_def["emoji"],
            "badge_description": badge_def["description"],
            "is_unlocked": False,
            "earned_at": None,
        })
    return result


def has_badge(db: Session, user_id: str, badge_key: str) -> bool:
    """
    Check if user already has a specific badge.

    Args:
        db: The database session.
        user_id: The unique ID of the user.
        badge_key: The identifier of the badge.

    Returns:
        True if the user has the badge, False otherwise.
    """
    return (
        db.query(Badge)
        .filter(Badge.user_id == user_id, Badge.badge_key == badge_key)
        .first()
        is not None
    )


def award_badge(db: Session, user_id: str, badge_key: str) -> Optional[Badge]:
    """
    Award a badge to a user if they don't already have it.

    Args:
        db: The database session.
        user_id: The unique ID of the user.
        badge_key: The identifier of the badge.

    Returns:
        The awarded Badge instance or None.
    """
    if badge_key not in BADGE_DEFINITIONS:
        return None

    if has_badge(db, user_id, badge_key):
        return None

    badge_def = BADGE_DEFINITIONS[badge_key]
    badge = Badge(
        user_id=user_id,
        badge_key=badge_key,
        badge_name=badge_def["name"],
        badge_emoji=badge_def["emoji"],
        badge_description=badge_def["description"],
        earned_at=datetime.utcnow(),
    )
    db.add(badge)

    # Award XP for earning a badge
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.xp = (user.xp or 0) + 25

    db.commit()
    db.refresh(badge)
    return badge


def check_and_award_badges(db: Session, user_id: str) -> list[Badge]:
    """
    Check all badge conditions and award any newly earned badges.

    Args:
        db: The database session.
        user_id: The unique ID of the user.

    Returns:
        List of awarded Badge instances.
    """
    awarded = []

    activities = (
        db.query(Activity)
        .filter(Activity.user_id == user_id)
        .order_by(Activity.log_date.desc())
        .all()
    )

    if not activities:
        return awarded

    # 🌱 Seedha Seedha Shuruaat — first log
    if len(activities) >= 1:
        badge = award_badge(db, user_id, "seedha_shuruaat")
        if badge:
            awarded.append(badge)

    # 🚶 Paidal Hero — 5+ days with walk/cycle logged (walk_km > 0)
    walk_days = sum(1 for a in activities if (a.transport_walk_km or 0) > 0)
    if walk_days >= 5:
        badge = award_badge(db, user_id, "paidal_hero")
        if badge:
            awarded.append(badge)

    # 🍃 Veg Warrior — 7 consecutive days with veg meals and no nonveg
    consecutive_veg = 0
    max_consecutive_veg = 0
    sorted_activities = sorted(activities, key=lambda a: a.log_date)
    for act in sorted_activities:
        if (act.food_veg_meals or 0) > 0 and (act.food_nonveg_meals or 0) == 0:
            consecutive_veg += 1
            max_consecutive_veg = max(max_consecutive_veg, consecutive_veg)
        else:
            consecutive_veg = 0

    if max_consecutive_veg >= 7:
        badge = award_badge(db, user_id, "veg_warrior")
        if badge:
            awarded.append(badge)

    # ⚡ Bijli Bachao Champion — 5 days with AC < 2 hours
    low_ac_days = sum(1 for a in activities if (a.energy_ac_hours or 0) < 2)
    if low_ac_days >= 5:
        badge = award_badge(db, user_id, "bijli_bachao")
        if badge:
            awarded.append(badge)

    # 🌍 Carbon Crusher — 30-day streak below 5kg/day
    consecutive_green = 0
    max_consecutive_green = 0
    for act in sorted_activities:
        if (act.total_kg_co2 or 0) < 5.0:
            consecutive_green += 1
            max_consecutive_green = max(max_consecutive_green, consecutive_green)
        else:
            consecutive_green = 0

    if max_consecutive_green >= 30:
        badge = award_badge(db, user_id, "carbon_crusher")
        if badge:
            awarded.append(badge)

    # 🏆 HaraBharat Legend — 100 days logged
    if len(activities) >= 100:
        badge = award_badge(db, user_id, "harabharat_legend")
        if badge:
            awarded.append(badge)

    return awarded


def get_user_badges(db: Session, user_id: str) -> list[dict]:
    """
    Get all badge definitions with user's unlock status.

    Args:
        db: The database session.
        user_id: The unique ID of the user.

    Returns:
        List of dictionaries representing the user's badges.
    """
    earned = (
        db.query(Badge)
        .filter(Badge.user_id == user_id)
        .all()
    )
    earned_map = {b.badge_key: b.earned_at for b in earned}

    result = []
    for key, badge_def in BADGE_DEFINITIONS.items():
        result.append({
            "badge_key": key,
            "badge_name": badge_def["name"],
            "badge_emoji": badge_def["emoji"],
            "badge_description": badge_def["description"],
            "is_unlocked": key in earned_map,
            "earned_at": earned_map.get(key),
        })
    return result
