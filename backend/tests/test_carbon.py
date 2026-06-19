"""
Tests for carbon calculator service.
Verifies emission factor accuracy and edge cases.
"""

import pytest

from services.carbon_calculator import (
    calculate_transport_co2,
    calculate_food_co2,
    calculate_energy_co2,
    calculate_waste_co2,
    calculate_total_co2,
    get_day_rating,
    EMISSION_FACTORS,
)


class TestTransportCalculations:
    """Transport emission calculations."""

    def test_petrol_car_10km(self):
        """Petrol car 10km = 2.1 kg CO2."""
        result = calculate_transport_co2(car_km=10)
        assert result == 2.1

    def test_motorcycle_20km(self):
        """Motorcycle 20km = 2.06 kg CO2."""
        result = calculate_transport_co2(bike_km=20)
        assert result == 2.06

    def test_bus_10km(self):
        """Bus 10km = 0.89 kg CO2."""
        result = calculate_transport_co2(bus_km=10)
        assert result == 0.89

    def test_train_50km(self):
        """Train 50km = 2.05 kg CO2."""
        result = calculate_transport_co2(train_km=50)
        assert result == 2.05

    def test_walking_zero_emissions(self):
        """Walking produces 0 kg CO2."""
        result = calculate_transport_co2(walk_km=10)
        assert result == 0.0

    def test_zero_input_zero_emissions(self):
        """Zero inputs = 0 emissions."""
        result = calculate_transport_co2()
        assert result == 0.0

    def test_combined_transport(self):
        """Combined transport calculation is sum of individual."""
        result = calculate_transport_co2(car_km=10, bus_km=5)
        expected = round(10 * 0.21 + 5 * 0.089, 2)
        assert result == expected


class TestFoodCalculations:
    """Food emission calculations."""

    def test_nonveg_meal(self):
        """1 non-veg meal = 3.3 kg CO2."""
        result = calculate_food_co2(nonveg_meals=1)
        assert result == 3.3

    def test_veg_meal(self):
        """1 veg meal = 1.1 kg CO2."""
        result = calculate_food_co2(veg_meals=1)
        assert result == 1.1

    def test_homemade_meal(self):
        """1 homemade meal = 0.8 kg CO2."""
        result = calculate_food_co2(homemade_meals=1)
        assert result == 0.8

    def test_combined_food(self):
        """Combined food calculation is correct."""
        result = calculate_food_co2(nonveg_meals=1, veg_meals=2)
        expected = round(3.3 + 2 * 1.1, 2)
        assert result == expected

    def test_zero_food_zero_emissions(self):
        """No food entries = 0 emissions."""
        result = calculate_food_co2()
        assert result == 0.0


class TestEnergyCalculations:
    """Energy emission calculations."""

    def test_ac_3_hours(self):
        """AC 3 hours = 3.6 kg CO2."""
        result = calculate_energy_co2(ac_hours=3)
        assert result == 3.6

    def test_geyser_1_hour(self):
        """Geyser 1 hour = 1.0 kg CO2."""
        result = calculate_energy_co2(geyser_hours=1)
        assert result == 1.0

    def test_zero_energy_zero_emissions(self):
        """No energy use = 0 emissions."""
        result = calculate_energy_co2()
        assert result == 0.0


class TestWasteCalculations:
    """Waste emission calculations."""

    def test_plastic_items(self):
        """2 plastic items = 0.12 kg CO2."""
        result = calculate_waste_co2(plastic_items=2)
        assert result == 0.12

    def test_delivery_order(self):
        """1 delivery order = 0.5 kg CO2."""
        result = calculate_waste_co2(delivery_orders=1)
        assert result == 0.5

    def test_recycling_offset(self):
        """Recycling gives a small negative offset."""
        with_recycling = calculate_waste_co2(plastic_items=5, recycling_done=True)
        without_recycling = calculate_waste_co2(plastic_items=5, recycling_done=False)
        assert with_recycling < without_recycling

    def test_zero_waste_zero_emissions(self):
        """No waste = 0 emissions."""
        result = calculate_waste_co2()
        assert result == 0.0


class TestTotalCalculation:
    """Total CO2 calculation."""

    def test_total_is_sum(self):
        """Total is sum of all categories."""
        result = calculate_total_co2(2.1, 3.3, 1.2, 0.5)
        assert result == 7.1

    def test_total_with_zeros(self):
        """Total with all zeros is 0."""
        result = calculate_total_co2(0, 0, 0, 0)
        assert result == 0.0


class TestDayRating:
    """Day rating (green/yellow/red) thresholds."""

    def test_green_below_5(self):
        """< 5kg is green."""
        assert get_day_rating(4.9) == "green"

    def test_green_at_zero(self):
        """0kg is green."""
        assert get_day_rating(0) == "green"

    def test_yellow_at_5(self):
        """5kg is yellow."""
        assert get_day_rating(5.0) == "yellow"

    def test_yellow_at_10(self):
        """10kg is yellow."""
        assert get_day_rating(10.0) == "yellow"

    def test_red_above_10(self):
        """> 10kg is red."""
        assert get_day_rating(10.1) == "red"


class TestEmissionFactors:
    """Verify emission factor constants match documented IPCC values."""

    def test_car_factor(self):
        assert EMISSION_FACTORS["car"] == 0.21

    def test_bike_factor(self):
        assert EMISSION_FACTORS["bike"] == 0.103

    def test_bus_factor(self):
        assert EMISSION_FACTORS["bus"] == 0.089

    def test_train_factor(self):
        assert EMISSION_FACTORS["train"] == 0.041

    def test_ac_factor(self):
        assert EMISSION_FACTORS["ac"] == 1.2

    def test_nonveg_factor(self):
        assert EMISSION_FACTORS["nonveg_meal"] == 3.3

    def test_veg_factor(self):
        assert EMISSION_FACTORS["veg_meal"] == 1.1

    def test_plastic_factor(self):
        assert EMISSION_FACTORS["plastic_item"] == 0.06

    def test_delivery_factor(self):
        assert EMISSION_FACTORS["delivery_order"] == 0.5
