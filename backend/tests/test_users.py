"""
Tests for user registration and login endpoints.
Verifies bcrypt hashing, validation, and error handling.
"""

import pytest
from fastapi.testclient import TestClient

from main import app
from database import Base, engine, SessionLocal
from models import User


@pytest.fixture(autouse=True)
def setup_db():
    """Create fresh database tables for each test."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    """Test client for FastAPI app."""
    return TestClient(app)


@pytest.fixture
def registered_user(client):
    """Create and return a registered user."""
    response = client.post("/api/users/register", json={
        "name": "TestUser",
        "city": "Mumbai",
        "pin": "1234",
    })
    return response.json()


class TestUserRegistration:
    """Tests for POST /api/users/register."""

    def test_register_success(self, client):
        """User creation with valid data succeeds."""
        response = client.post("/api/users/register", json={
            "name": "Ravi",
            "city": "Delhi",
            "pin": "5678",
        })
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Ravi"
        assert data["user_id"]
        assert "Swagat hai" in data["message"]

    def test_register_missing_name_fails_422(self, client):
        """User creation with missing name fails with 422."""
        response = client.post("/api/users/register", json={
            "city": "Delhi",
            "pin": "5678",
        })
        assert response.status_code == 422

    def test_register_missing_city_fails_422(self, client):
        """User creation with missing city fails with 422."""
        response = client.post("/api/users/register", json={
            "name": "Ravi",
            "pin": "5678",
        })
        assert response.status_code == 422

    def test_register_invalid_pin_fails(self, client):
        """PIN with non-digit characters is rejected."""
        response = client.post("/api/users/register", json={
            "name": "Ravi",
            "city": "Delhi",
            "pin": "abcd",
        })
        assert response.status_code == 422

    def test_register_short_pin_fails(self, client):
        """PIN shorter than 4 digits is rejected."""
        response = client.post("/api/users/register", json={
            "name": "Ravi",
            "city": "Delhi",
            "pin": "12",
        })
        assert response.status_code == 422

    def test_pin_stored_as_hash(self, client):
        """PIN is stored as bcrypt hash, not plain text."""
        client.post("/api/users/register", json={
            "name": "HashTestUser",
            "city": "Bangalore",
            "pin": "9999",
        })
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.name == "HashTestUser").first()
            assert user is not None
            assert user.pin_hash != "9999"
            assert user.pin_hash.startswith("$2b$")
        finally:
            db.close()

    def test_duplicate_name_fails(self, client, registered_user):
        """Registering with an existing name fails."""
        response = client.post("/api/users/register", json={
            "name": "TestUser",
            "city": "Pune",
            "pin": "4321",
        })
        assert response.status_code == 409

    def test_name_max_length(self, client):
        """Name exceeding 50 characters is rejected."""
        response = client.post("/api/users/register", json={
            "name": "A" * 51,
            "city": "Delhi",
            "pin": "1234",
        })
        assert response.status_code == 422


class TestUserLogin:
    """Tests for POST /api/users/login."""

    def test_login_success(self, client, registered_user):
        """Login with correct PIN succeeds."""
        response = client.post("/api/users/login", json={
            "name": "TestUser",
            "pin": "1234",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "TestUser"
        assert data["user_id"] == registered_user["user_id"]

    def test_login_wrong_pin_fails_401(self, client, registered_user):
        """Login with wrong PIN fails with 401."""
        response = client.post("/api/users/login", json={
            "name": "TestUser",
            "pin": "0000",
        })
        assert response.status_code == 401

    def test_login_unknown_name_fails_401(self, client):
        """Login with non-existent name fails with 401."""
        response = client.post("/api/users/login", json={
            "name": "NonExistentUser",
            "pin": "1234",
        })
        assert response.status_code == 401


class TestUserProfile:
    """Tests for GET /api/users/profile/{user_id}."""

    def test_get_profile_success(self, client, registered_user):
        """Fetching profile with valid user_id succeeds."""
        uid = registered_user["user_id"]
        response = client.get(f"/api/users/profile/{uid}")
        assert response.status_code == 200
        assert response.json()["name"] == "TestUser"

    def test_get_profile_not_found(self, client):
        """Fetching profile with invalid user_id returns 404."""
        response = client.get("/api/users/profile/00000000-0000-0000-0000-000000000000")
        assert response.status_code == 404
