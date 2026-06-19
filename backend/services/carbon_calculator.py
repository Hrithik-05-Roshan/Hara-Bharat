"""
Carbon emission calculator service.
Uses IPCC and India-specific emission factors for accurate CO2 calculations.
"""

# ─── EMISSION FACTORS (kg CO2 per unit) ───
# Sources: IPCC AR6, India GHG Platform, TERI India

EMISSION_FACTORS = {
    # Transport (kg CO2 per km)
    "car": 0.21,           # Petrol car — IPCC default for light-duty vehicles
    "bike": 0.103,         # Motorcycle — India 2-wheeler average
    "bus": 0.089,          # Public bus — per passenger-km (India avg occupancy)
    "train": 0.041,        # Indian Railways — per passenger-km
    "auto": 0.098,         # Auto-rickshaw — India avg (CNG/petrol mix)
    "walk": 0.0,           # Walking / cycling — zero emissions

    # Food (kg CO2 per meal)
    "nonveg_meal": 3.3,    # Meat-heavy meal — livestock + cooking
    "veg_meal": 1.1,       # Vegetarian meal — crop-based
    "packaged_meal": 2.0,  # Processed / packaged food — production + packaging
    "homemade_meal": 0.8,  # Home cooked — minimal processing

    # Energy (kg CO2 per hour/load)
    "ac": 1.2,             # Air conditioner — India grid emission factor
    "geyser": 1.0,         # Water heater — electric, India grid
    "washing": 0.5,        # Washing machine per load
    "fan_lights": 0.1,     # Fan + lights — low wattage

    # Waste (kg CO2 per item/order)
    "plastic_item": 0.06,  # Single plastic item — production + disposal
    "delivery_order": 0.5, # Online delivery — packaging + last-mile transport
    "recycling_offset": -0.1,  # Recycling reduces footprint slightly
}


def calculate_transport_co2(
    car_km: float = 0.0,
    bike_km: float = 0.0,
    bus_km: float = 0.0,
    train_km: float = 0.0,
    auto_km: float = 0.0,
    walk_km: float = 0.0,
) -> float:
    """Calculate transport category CO2 emissions in kg."""
    total = (
        car_km * EMISSION_FACTORS["car"]
        + bike_km * EMISSION_FACTORS["bike"]
        + bus_km * EMISSION_FACTORS["bus"]
        + train_km * EMISSION_FACTORS["train"]
        + auto_km * EMISSION_FACTORS["auto"]
        + walk_km * EMISSION_FACTORS["walk"]
    )
    return round(max(total, 0.0), 2)


def calculate_food_co2(
    nonveg_meals: int = 0,
    veg_meals: int = 0,
    packaged_meals: int = 0,
    homemade_meals: int = 0,
) -> float:
    """Calculate food category CO2 emissions in kg."""
    total = (
        nonveg_meals * EMISSION_FACTORS["nonveg_meal"]
        + veg_meals * EMISSION_FACTORS["veg_meal"]
        + packaged_meals * EMISSION_FACTORS["packaged_meal"]
        + homemade_meals * EMISSION_FACTORS["homemade_meal"]
    )
    return round(max(total, 0.0), 2)


def calculate_energy_co2(
    ac_hours: float = 0.0,
    geyser_hours: float = 0.0,
    washing_loads: int = 0,
    fan_lights_hours: float = 0.0,
) -> float:
    """Calculate home energy category CO2 emissions in kg."""
    total = (
        ac_hours * EMISSION_FACTORS["ac"]
        + geyser_hours * EMISSION_FACTORS["geyser"]
        + washing_loads * EMISSION_FACTORS["washing"]
        + fan_lights_hours * EMISSION_FACTORS["fan_lights"]
    )
    return round(max(total, 0.0), 2)


def calculate_waste_co2(
    plastic_items: int = 0,
    delivery_orders: int = 0,
    recycling_done: bool = False,
) -> float:
    """Calculate waste category CO2 emissions in kg."""
    total = (
        plastic_items * EMISSION_FACTORS["plastic_item"]
        + delivery_orders * EMISSION_FACTORS["delivery_order"]
    )
    if recycling_done:
        total += EMISSION_FACTORS["recycling_offset"]
    return round(max(total, 0.0), 2)


def calculate_total_co2(
    transport_co2: float,
    food_co2: float,
    energy_co2: float,
    waste_co2: float,
) -> float:
    """Calculate total daily CO2 emissions in kg."""
    return round(transport_co2 + food_co2 + energy_co2 + waste_co2, 2)


def get_day_rating(total_kg: float) -> str:
    """
    Rate the day's carbon footprint.
    Green: < 5 kg CO2
    Yellow: 5–10 kg CO2
    Red: > 10 kg CO2
    """
    if total_kg < 5.0:
        return "green"
    elif total_kg <= 10.0:
        return "yellow"
    else:
        return "red"
