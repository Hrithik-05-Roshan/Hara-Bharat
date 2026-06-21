"""
User registration and login endpoints.
Uses bcrypt for PIN hashing — no plain text PINs stored.
"""

# pyrefly: ignore [missing-import]
import bcrypt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schemas import UserRegister, UserLogin, UserResponse

router = APIRouter(prefix="/api/users", tags=["Users"])


def hash_pin(pin: str) -> str:
    """
    Hash a PIN using bcrypt.

    Args:
        pin: The raw PIN string.

    Returns:
        The bcrypt hashed PIN string.
    """
    return bcrypt.hashpw(pin.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_pin(pin: str, hashed: str) -> bool:
    """
    Verify a PIN against its bcrypt hash.

    Args:
        pin: The raw PIN string.
        hashed: The bcrypt hashed string.

    Returns:
        True if verification succeeds, False otherwise.
    """
    return bcrypt.checkpw(pin.encode("utf-8"), hashed.encode("utf-8"))


@router.post("/register", response_model=UserResponse, status_code=201)
def register_user(data: UserRegister, db: Session = Depends(get_db)) -> UserResponse:
    """
    Register a new user with name, city, and 4-digit PIN.

    Args:
        data: The UserRegister request payload.
        db: The database session.

    Returns:
        UserResponse containing registered user details.
    """
    # Check if name already exists
    existing = db.query(User).filter(User.name == data.name).first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail="Ye naam pehle se registered hai! Login karo ya dusra naam try karo.",
        )

    user = User(
        name=data.name,
        city=data.city,
        pin_hash=hash_pin(data.pin),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return UserResponse(
        user_id=user.id,
        name=user.name,
        city=user.city,
        xp=user.xp,
        message=f"Swagat hai, {user.name}! 🌿",
    )


@router.post("/login", response_model=UserResponse)
def login_user(data: UserLogin, db: Session = Depends(get_db)) -> UserResponse:
    """
    Login with name + PIN to restore existing session.

    Args:
        data: The UserLogin request payload.
        db: The database session.

    Returns:
        UserResponse containing logged in user details.
    """
    user = db.query(User).filter(User.name == data.name).first()
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Ye naam nahi mila! Pehle register karo.",
        )

    if not verify_pin(data.pin, user.pin_hash):
        raise HTTPException(
            status_code=401,
            detail="Galat PIN! Dobara try karo.",
        )

    return UserResponse(
        user_id=user.id,
        name=user.name,
        city=user.city,
        xp=user.xp,
        message=f"Wapas aaye, {user.name}! 🌿",
    )


@router.get("/profile/{user_id}", response_model=UserResponse)
def get_user_profile(user_id: str, db: Session = Depends(get_db)) -> UserResponse:
    """
    Get user profile by user_id.

    Args:
        user_id: The unique user ID.
        db: The database session.

    Returns:
        UserResponse containing user profile details.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User nahi mila!")

    return UserResponse(
        user_id=user.id,
        name=user.name,
        city=user.city,
        xp=user.xp,
        message="Profile loaded!",
    )
