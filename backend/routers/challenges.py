"""
Daily challenges endpoints.
Generates AI-powered eco challenges and tracks completion.
"""

from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Activity, Challenge, User
from schemas import ChallengeResponse
from services.gemini_service import generate_daily_challenges

router = APIRouter(prefix="/api/challenges", tags=["Challenges"])


def _get_weakest_category(db: Session, user_id: str) -> str:
    """
    Determine user's highest-emission category from recent activity.

    Args:
        db: The database session.
        user_id: The unique user ID.

    Returns:
        Name of the highest-emission category.
    """
    recent = (
        db.query(Activity)
        .filter(Activity.user_id == user_id)
        .order_by(Activity.log_date.desc())
        .limit(7)
        .all()
    )

    if not recent:
        return "transport"

    totals = {
        "transport": sum(a.transport_co2 or 0 for a in recent),
        "food": sum(a.food_co2 or 0 for a in recent),
        "energy": sum(a.energy_co2 or 0 for a in recent),
        "waste": sum(a.waste_co2 or 0 for a in recent),
    }

    return max(totals, key=totals.get)


@router.get("/{user_id}/today", response_model=list[ChallengeResponse])
async def get_today_challenges(user_id: str, db: Session = Depends(get_db)) -> list[ChallengeResponse]:
    """
    Get today's 3 daily challenges for a user.

    Args:
        user_id: The unique user ID.
        db: The database session.

    Returns:
        List of ChallengeResponse objects.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User nahi mila!")

    # Check if challenges already generated for today
    existing = (
        db.query(Challenge)
        .filter(
            Challenge.user_id == user_id,
            Challenge.challenge_date == date.today(),
        )
        .all()
    )

    if existing:
        return [
            ChallengeResponse(
                id=c.id,
                challenge_text=c.challenge_text,
                category=c.category,
                co2_saving_kg=c.co2_saving_kg,
                is_completed=c.is_completed,
            )
            for c in existing
        ]

    # Determine weakest category and generate challenges
    weakest = _get_weakest_category(db, user_id)

    # Get today's total if available
    today_activity = (
        db.query(Activity)
        .filter(Activity.user_id == user_id, Activity.log_date == date.today())
        .first()
    )
    total_co2 = today_activity.total_kg_co2 if today_activity else 5.0

    # Generate via Gemini
    challenge_data = await generate_daily_challenges(weakest, total_co2)

    # Store in DB
    challenges = []
    for cd in challenge_data:
        challenge = Challenge(
            user_id=user_id,
            challenge_date=date.today(),
            challenge_text=cd["text"],
            category=cd["category"],
            co2_saving_kg=cd["co2_saving"],
            is_completed=False,
        )
        db.add(challenge)
        challenges.append(challenge)

    db.commit()
    for c in challenges:
        db.refresh(c)

    return [
        ChallengeResponse(
            id=c.id,
            challenge_text=c.challenge_text,
            category=c.category,
            co2_saving_kg=c.co2_saving_kg,
            is_completed=c.is_completed,
        )
        for c in challenges
    ]


@router.post("/{user_id}/complete/{challenge_id}")
def complete_challenge(
    user_id: str,
    challenge_id: str,
    db: Session = Depends(get_db),
) -> dict:
    """
    Mark a challenge as completed and award XP.

    Args:
        user_id: The unique user ID.
        challenge_id: The challenge ID.
        db: The database session.

    Returns:
        Dictionary with message, xp_earned, and all_completed flag.
    """
    challenge = (
        db.query(Challenge)
        .filter(
            Challenge.id == challenge_id,
            Challenge.user_id == user_id,
        )
        .first()
    )

    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge nahi mila!")

    if challenge.is_completed:
        return {"message": "Ye challenge pehle se complete hai!", "xp_earned": 0}

    challenge.is_completed = True
    challenge.completed_at = datetime.utcnow()

    # Award XP
    user = db.query(User).filter(User.id == user_id).first()
    xp_earned = 15  # Per challenge

    # Check if all 3 today's challenges are now complete
    today_challenges = (
        db.query(Challenge)
        .filter(
            Challenge.user_id == user_id,
            Challenge.challenge_date == date.today(),
        )
        .all()
    )

    all_completed = all(
        c.is_completed or c.id == challenge_id for c in today_challenges
    )
    if all_completed:
        xp_earned += 50  # Bonus for completing all 3

    if user:
        user.xp = (user.xp or 0) + xp_earned

    db.commit()

    return {
        "message": "Bahut acha! Challenge complete hua! 🌿",
        "xp_earned": xp_earned,
        "all_completed": all_completed,
    }


@router.get("/{user_id}/history", response_model=list[ChallengeResponse])
def get_challenge_history(user_id: str, db: Session = Depends(get_db)) -> list[ChallengeResponse]:
    """
    Get last 7 days of challenge history.

    Args:
        user_id: The unique user ID.
        db: The database session.

    Returns:
        List of ChallengeResponse objects.
    """
    start_date = date.today() - timedelta(days=7)

    challenges = (
        db.query(Challenge)
        .filter(
            Challenge.user_id == user_id,
            Challenge.challenge_date >= start_date,
        )
        .order_by(Challenge.challenge_date.desc())
        .all()
    )

    return [
        ChallengeResponse(
            id=c.id,
            challenge_text=c.challenge_text,
            category=c.category,
            co2_saving_kg=c.co2_saving_kg,
            is_completed=c.is_completed,
        )
        for c in challenges
    ]
