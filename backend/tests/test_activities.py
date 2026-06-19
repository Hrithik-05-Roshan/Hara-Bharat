"""
Tests for activity logging and history endpoints.
Verifies CO2 calculations, daily summaries, and history retrieval.
"""

import pytest
from datetime import date
from fastapi.testclient import TestClient

from main import app
from database import Base, engine


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
def user_id(client):
    """Create a test user and return their user_id."""
    response = client.post("/api/users/register", json={
        "name": "ActivityTestUser",
        "city": "Mumbai",
        "pin": "1234",
    })
    return response.json()["user_id"]


class TestActivityLog:
    """Tests for POST /api/activities/log."""

    def test_log_activity_success(self, client, user_id):
        """Activity log creation succeeds with valid data."""
        response = client.post("/api/activities/log", json={
            "user_id": user_id,
            "log_date": str(date.today()),
            "transport": {"car_km": 10, "bike_km": 0, "bus_km": 0,
                          "train_km": 0, "auto_km": 0, "walk_km": 0},
            "food": {"nonveg_meals": 1, "veg_meals": 2,
                     "packaged_meals": 0, "homemade_meals": 1},
            "energy": {"ac_hours": 3, "geyser_hours": 0.5,
                       "washing_loads": 1, "fan_lights_hours": 8},
            "waste": {"plastic_items": 2, "delivery_orders": 1,
                      "recycling_done": True},
        })
        assert response.status_code == 201
        data = response.json()
        assert data["total_kg_co2"] > 0
        assert data["activity_id"]
        assert "category_breakdown" in data
        assert data["day_rating"] in ["green", "yellow", "red"]

    def test_log_calculates_transport_co2(self, client, user_id):
        """Transport CO2 calculation: 10km car = 2.1 kg."""
        response = client.post("/api/activities/log", json={
            "user_id": user_id,
            "log_date": str(date.today()),
            "transport": {"car_km": 10, "bike_km": 0, "bus_km": 0,
                          "train_km": 0, "auto_km": 0, "walk_km": 0},
            "food": {"nonveg_meals": 0, "veg_meals": 0,
                     "packaged_meals": 0, "homemade_meals": 0},
            "energy": {"ac_hours": 0, "geyser_hours": 0,
                       "washing_loads": 0, "fan_lights_hours": 0},
            "waste": {"plastic_items": 0, "delivery_orders": 0,
                      "recycling_done": False},
        })
        data = response.json()
        assert data["category_breakdown"]["transport"] == 2.1
        assert data["total_kg_co2"] == 2.1

    def test_zero_emissions_for_walking(self, client, user_id):
        """Walking produces zero emissions."""
        response = client.post("/api/activities/log", json={
            "user_id": user_id,
            "log_date": str(date.today()),
            "transport": {"car_km": 0, "bike_km": 0, "bus_km": 0,
                          "train_km": 0, "auto_km": 0, "walk_km": 5},
            "food": {"nonveg_meals": 0, "veg_meals": 0,
                     "packaged_meals": 0, "homemade_meals": 0},
            "energy": {"ac_hours": 0, "geyser_hours": 0,
                       "washing_loads": 0, "fan_lights_hours": 0},
            "waste": {"plastic_items": 0, "delivery_orders": 0,
                      "recycling_done": False},
        })
        data = response.json()
        assert data["total_kg_co2"] == 0.0

    def test_log_invalid_user_fails(self, client):
        """Logging for non-existent user fails."""
        response = client.post("/api/activities/log", json={
            "user_id": "00000000-0000-0000-0000-000000000000",
            "log_date": str(date.today()),
            "transport": {"car_km": 0},
            "food": {},
            "energy": {},
            "waste": {},
        })
        assert response.status_code == 404

    def test_log_updates_existing(self, client, user_id):
        """Logging on the same date updates existing entry."""
        payload = {
            "user_id": user_id,
            "log_date": str(date.today()),
            "transport": {"car_km": 10},
            "food": {},
            "energy": {},
            "waste": {},
        }
        client.post("/api/activities/log", json=payload)

        payload["transport"]["car_km"] = 20
        response = client.post("/api/activities/log", json=payload)
        data = response.json()
        assert data["category_breakdown"]["transport"] == 4.2

    def test_day_rating_green(self, client, user_id):
        """Day with < 5kg CO2 is rated green."""
        response = client.post("/api/activities/log", json={
            "user_id": user_id,
            "log_date": str(date.today()),
            "transport": {"car_km": 5},
            "food": {},
            "energy": {},
            "waste": {},
        })
        data = response.json()
        assert data["day_rating"] == "green"

    def test_day_rating_red(self, client, user_id):
        """Day with > 10kg CO2 is rated red."""
        response = client.post("/api/activities/log", json={
            "user_id": user_id,
            "log_date": str(date.today()),
            "transport": {"car_km": 50},
            "food": {"nonveg_meals": 2},
            "energy": {"ac_hours": 5},
            "waste": {},
        })
        data = response.json()
        assert data["day_rating"] == "red"


class TestActivityHistory:
    """Tests for GET /api/activities/{user_id}/history."""

    def test_empty_history(self, client, user_id):
        """New user has empty history."""
        response = client.get(f"/api/activities/{user_id}/history?days=30")
        assert response.status_code == 200
        assert response.json() == []

    def test_history_after_log(self, client, user_id):
        """History contains logged activities."""
        client.post("/api/activities/log", json={
            "user_id": user_id,
            "log_date": str(date.today()),
            "transport": {"car_km": 10},
            "food": {},
            "energy": {},
            "waste": {},
        })
        response = client.get(f"/api/activities/{user_id}/history?days=30")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["total_kg_co2"] > 0


class TestDashboardSummary:
    """Tests for GET /api/activities/dashboard/{user_id}/summary."""

    def test_dashboard_empty_user(self, client, user_id):
        """Dashboard for user with no logs returns zeros."""
        response = client.get(f"/api/activities/dashboard/{user_id}/summary")
        assert response.status_code == 200
        data = response.json()
        assert data["today_score"] == 0.0
        assert data["streak_days"] == 0

    def test_dashboard_with_data(self, client, user_id):
        """Dashboard reflects logged data."""
        client.post("/api/activities/log", json={
            "user_id": user_id,
            "log_date": str(date.today()),
            "transport": {"car_km": 10},
            "food": {"veg_meals": 2},
            "energy": {},
            "waste": {},
        })
        response = client.get(f"/api/activities/dashboard/{user_id}/summary")
        data = response.json()
        assert data["today_score"] > 0
        assert data["badges_count"] >= 1  # Should earn "Seedha Shuruaat"
