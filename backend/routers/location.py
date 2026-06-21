"""
Location Intelligence router — Mera Shehar 🌍
Provides APIs for local weather/AQI, AI location recommendations, city comparisons, and green spots.
"""

import os
import random
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import User, Activity
from services.gemini_service import genai

router = APIRouter(prefix="/api/location", tags=["Location"])

# Weather and AQI Mock Database for major Indian cities
INDIAN_CITIES_WEATHER = {
    "delhi": {"temp": 32, "aqi": 210, "humidity": 65, "status": "Poor Air Quality", "risk": "High"},
    "mumbai": {"temp": 29, "aqi": 85, "humidity": 82, "status": "Satisfactory", "risk": "Low"},
    "kolkata": {"temp": 31, "aqi": 115, "humidity": 75, "status": "Moderate Pollution", "risk": "Moderate"},
    "bangalore": {"temp": 26, "aqi": 52, "humidity": 60, "status": "Good", "risk": "Minimal"},
    "chennai": {"temp": 33, "aqi": 72, "humidity": 78, "status": "Satisfactory", "risk": "Low"},
    "hyderabad": {"temp": 30, "aqi": 95, "humidity": 58, "status": "Moderate Pollution", "risk": "Low"},
    "asansol": {"temp": 32, "aqi": 148, "humidity": 70, "status": "Moderate Pollution", "risk": "Moderate"},
}

class WeatherResponse(BaseModel):
    city: str
    temp: float
    aqi: int
    humidity: int
    status: str
    risk: str

@router.get("/weather", response_model=WeatherResponse)
def get_city_weather(city: str) -> WeatherResponse:
    """
    Retrieve weather & AQI for a city, with dynamic simulation for fallback.

    Args:
        city: The name of the city.

    Returns:
        WeatherResponse object containing weather and AQI metrics.
    """
    city_key = city.strip().lower()
    
    # Check if we have pre-configured values, otherwise generate plausible values
    if city_key in INDIAN_CITIES_WEATHER:
        data = INDIAN_CITIES_WEATHER[city_key].copy()
    else:
        # Generate dynamic plausible values
        random.seed(city_key)
        temp = round(random.uniform(22.0, 38.0), 1)
        aqi = random.randint(45, 180)
        humidity = random.randint(40, 90)
        
        if aqi <= 50:
            status = "Good"
            risk = "Minimal"
        elif aqi <= 100:
            status = "Satisfactory"
            risk = "Low"
        elif aqi <= 150:
            status = "Moderate Pollution"
            risk = "Moderate"
        else:
            status = "Poor Air Quality"
            risk = "High"
            
        data = {
            "temp": temp,
            "aqi": aqi,
            "humidity": humidity,
            "status": status,
            "risk": risk
        }
        
    return WeatherResponse(
        city=city.title(),
        temp=data["temp"],
        aqi=data["aqi"],
        humidity=data["humidity"],
        status=data["status"],
        risk=data["risk"]
    )

class InsightsRequest(BaseModel):
    city: str
    aqi: int
    temp: float
    humidity: int
    carbon_score: float

class InsightsResponse(BaseModel):
    recommendation: str

@router.post("/insights", response_model=InsightsResponse)
async def get_location_insights(data: InsightsRequest) -> InsightsResponse:
    """
    Generate localized AI insights using Gemini.

    Args:
        data: InsightsRequest payload.

    Returns:
        InsightsResponse containing recommendation text.
    """
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    
    if not GEMINI_API_KEY:
        # Fallback recommendations if Gemini key is missing
        if data.aqi > 150:
            rec = f"Aaj {data.city} ka AQI kaafi high ({data.aqi}) hai! Short trips ke liye public transport use karein aur bahar face mask zarur lagayein 🌫️. Ghar pe ventilation switch off karein."
        else:
            rec = f"Aaj {data.city} ka mausam accha hai (AQI: {data.aqi}). Aap paidal chal kar ya cycle se commute karke apna aaj ka carbon footprint {data.carbon_score:.1f} kg se kam kar sakte hain! 🚴"
        return InsightsResponse(recommendation=rec)
        
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        prompt = f"""
        Analyze this Indian city environmental data:
        - City: {data.city}
        - AQI: {data.aqi}
        - Temperature: {data.temp}°C
        - Humidity: {data.humidity}%
        - User's Current Carbon Footprint: {data.carbon_score} kg CO2
        
        Generate a warm, practical sustainability recommendation in Hinglish (Roman script).
        Suggest 1-2 specific, actionable local tips to reduce carbon footprint based on these conditions.
        Keep it under 100 words. Use 1-2 emojis.
        """
        response = model.generate_content(prompt)
        return InsightsResponse(recommendation=response.text.strip())
    except Exception as e:
        rec = f"Aaj {data.city} mein weather control mein hai. Safe zone banaye rakhne ke liye public transit aur green habits apnayein! 🌿"
        return InsightsResponse(recommendation=rec)

class ChallengeItem(BaseModel):
    text: str
    co2_saving: float
    difficulty: str
    impact: int

class ChallengesResponse(BaseModel):
    city: str
    challenges: list[ChallengeItem]

CITY_SPECIFIC_CHALLENGES = {
    "delhi": [
        {"text": "Aaj Delhi Metro use karo car ki jagah 🚇", "co2_saving": 3.4, "difficulty": "Easy", "impact": 4},
        {"text": "AQI high hone ki wajah se direct active hours avoid karo ya carpool lo 🚗", "co2_saving": 2.1, "difficulty": "Medium", "impact": 3},
        {"text": "Okhla Bird Sanctuary ya kisi pass ke park mein 15 mins bitayein aur green lifestyle support karein 🌳", "co2_saving": 0.5, "difficulty": "Easy", "impact": 2}
    ],
    "kolkata": [
        {"text": "Kolkata Metro ya green tram se commute karo today 🚇", "co2_saving": 3.2, "difficulty": "Easy", "impact": 4},
        {"text": "Short travel ke liye rickshaw/walking prefer karo rather than taxi 🛺", "co2_saving": 1.5, "difficulty": "Easy", "impact": 3},
        {"text": "Sunderbans awareness campaign support karo ya local market se direct shopping karo local carry bag ke sath 🛍️", "co2_saving": 1.2, "difficulty": "Easy", "impact": 2}
    ],
    "mumbai": [
        {"text": "Mumbai local train use karo today 🚆", "co2_saving": 3.8, "difficulty": "Medium", "impact": 5},
        {"text": "Single-use plastic items completely avoid karo beach pollution rokne ke liye 🌊", "co2_saving": 1.8, "difficulty": "Easy", "impact": 3},
        {"text": "Ac/coolers ko 26 degrees pe set karein electricity waste kam karne ke liye ⚡", "co2_saving": 2.0, "difficulty": "Easy", "impact": 3}
    ],
    "bangalore": [
        {"text": "BMTC buses use karo and auto pooling prefer karo 🚌", "co2_saving": 2.8, "difficulty": "Easy", "impact": 4},
        {"text": "Washing machine loads full karke chalao paani bachane ke liye 💧", "co2_saving": 1.6, "difficulty": "Medium", "impact": 3},
        {"text": "Pass ki cycling tracks pe ride karein short trips ke liye 🚲", "co2_saving": 1.0, "difficulty": "Easy", "impact": 2}
    ]
}

DEFAULT_CHALLENGES = [
    {"text": "Short ride ke liye paidal chalein 🚶", "co2_saving": 0.8, "difficulty": "Easy", "impact": 2},
    {"text": "AC ka use 1 ghanta kam karein ❄️", "co2_saving": 1.2, "difficulty": "Easy", "impact": 3},
    {"text": "Ghar se aate-jaate extra lights & fans off karein 💡", "co2_saving": 0.5, "difficulty": "Easy", "impact": 2}
]

@router.get("/challenges", response_model=ChallengesResponse)
def get_location_challenges(city: str) -> ChallengesResponse:
    """
    Retrieve city-specific eco challenges.

    Args:
        city: The name of the city.

    Returns:
        ChallengesResponse listing eco challenges.
    """
    city_key = city.strip().lower()
    challenges = CITY_SPECIFIC_CHALLENGES.get(city_key, DEFAULT_CHALLENGES)
    
    return ChallengesResponse(
        city=city.title(),
        challenges=[ChallengeItem(**c) for c in challenges]
    )

class ComparisonResponse(BaseModel):
    user_avg: float
    city_avg: float
    target: float
    national_avg: float
    comparison_percentage: float
    ranking_badge: str

@router.get("/comparison/{user_id}", response_model=ComparisonResponse)
def get_user_city_comparison(user_id: str, db: Session = Depends(get_db)) -> ComparisonResponse:
    """
    Compare user's carbon metrics to city average and national data.

    Args:
        user_id: The unique user ID.
        db: The database session.

    Returns:
        ComparisonResponse comparing metrics.
    """
    # Find user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User nahi mila!")
        
    # User's last 7 activities
    user_activities = (
        db.query(Activity)
        .filter(Activity.user_id == user_id)
        .order_by(Activity.log_date.desc())
        .limit(7)
        .all()
    )
    
    user_avg = 0.0
    if user_activities:
        user_avg = sum(a.total_kg_co2 for a in user_activities) / len(user_activities)
        
    # Get city average. Query all activities in same city if possible
    # We join Activity and User models
    city_users = db.query(User).filter(User.city == user.city).all()
    city_user_ids = [u.id for u in city_users]
    
    city_activities = (
        db.query(Activity)
        .filter(Activity.user_id.in_(city_user_ids))
        .limit(100)
        .all()
    )
    
    # Fallback to general database average if no logs in city
    if not city_activities:
        city_activities = db.query(Activity).limit(100).all()
        
    if city_activities:
        city_avg = sum(a.total_kg_co2 for a in city_activities) / len(city_activities)
    else:
        city_avg = 4.8  # Plausible default city average
        
    # Adjust mock averages so they look interesting
    if city_avg < 1.0:
        city_avg = 4.8
    if user_avg == 0.0:
        user_avg = 3.8
        
    # Target and National Average constants
    target = 3.0
    national_avg = 5.2
    
    # Calculate percentage comparison
    diff = city_avg - user_avg
    comparison_percentage = (diff / city_avg) * 100 if city_avg > 0 else 0
    
    # Decide badge
    if comparison_percentage >= 25:
        ranking_badge = "Carbon Crusher Elite 👑"
    elif comparison_percentage >= 10:
        ranking_badge = "Green Champion 🏅"
    elif comparison_percentage >= 0:
        ranking_badge = "Active Earth Saver 🌿"
    else:
        ranking_badge = "Eco Learner 🌱"
        
    return ComparisonResponse(
        user_avg=round(user_avg, 2),
        city_avg=round(city_avg, 2),
        target=target,
        national_avg=national_avg,
        comparison_percentage=round(comparison_percentage, 1),
        ranking_badge=ranking_badge
    )

class SpotItem(BaseModel):
    name: str
    lat: float
    lng: float
    category: str
    benefit: str

class GreenSpotsResponse(BaseModel):
    city: str
    lat: float
    lng: float
    spots: list[SpotItem]

# Hardcoded green spot maps for top Indian cities
CITY_MAPS = {
    "delhi": {
        "lat": 28.6139,
        "lng": 77.2090,
        "spots": [
            {"name": "Lodhi Gardens 🌳", "lat": 28.5933, "lng": 77.2188, "category": "Park", "benefit": "Carbon offset, oxygen sanctuary"},
            {"name": "Delhi Metro Charging Station ⚡", "lat": 28.6143, "lng": 77.2114, "category": "EV Charging", "benefit": "Fast EV Charging for clean commute"},
            {"name": "Rajiv Chowk Metro Station 🚇", "lat": 28.6304, "lng": 77.2177, "category": "Metro Station", "benefit": "Mass transit hub reduces traffic footprint"},
            {"name": "National Zoological Park 🦁", "lat": 28.6083, "lng": 77.2471, "category": "Botanical Garden", "benefit": "Forest cover, biodiversity reserve"}
        ]
    },
    "kolkata": {
        "lat": 22.5726,
        "lng": 88.3639,
        "spots": [
            {"name": "Maidan Greenery 🌳", "lat": 22.5539, "lng": 88.3486, "category": "Park", "benefit": "Lungs of Kolkata, massive carbon sink"},
            {"name": "Park Street Metro 🚇", "lat": 22.5524, "lng": 88.3526, "category": "Metro Station", "benefit": "Zero emissions high speed transit"},
            {"name": "Acharya Jagadish Chandra Bose Botanical Garden 🌸", "lat": 22.5601, "lng": 88.2863, "category": "Botanical Garden", "benefit": "Home to the Great Banyan Tree, offsets tons of CO₂"},
            {"name": "Kolkata Tram Charging Yard ⚡", "lat": 22.5732, "lng": 88.3685, "category": "EV Charging", "benefit": "Electric tramways power grid"}
        ]
    },
    "mumbai": {
        "lat": 19.0760,
        "lng": 72.8777,
        "spots": [
            {"name": "Sanjay Gandhi National Park 🌳", "lat": 19.2215, "lng": 72.9185, "category": "Park", "benefit": "Massive urban forest offsetting carbon for Mumbai"},
            {"name": "Chhatrapati Shivaji Terminus Train Hub 🚆", "lat": 18.9398, "lng": 72.8355, "category": "Metro Station", "benefit": "Electrified suburban rail reduces road exhaust"},
            {"name": "Bandra Kurla EV Station ⚡", "lat": 19.0607, "lng": 72.8680, "category": "EV Charging", "benefit": "Fast EV Charging for electric cars & autos"},
            {"name": "Hanging Gardens Malabar Hill 🌸", "lat": 18.9566, "lng": 72.8055, "category": "Park", "benefit": "Terraced green space blocks sea wind & traps dust"}
        ]
    },
    "bangalore": {
        "lat": 12.9716,
        "lng": 77.5946,
        "spots": [
            {"name": "Cubbon Park 🌳", "lat": 12.9738, "lng": 77.5956, "category": "Park", "benefit": "Major carbon sink in Bangalore city center"},
            {"name": "Lalbagh Botanical Garden 🌸", "lat": 12.9507, "lng": 77.5902, "category": "Botanical Garden", "benefit": "Rich flora collection, cool microclimate zone"},
            {"name": "Indiranagar Metro Station 🚇", "lat": 12.9784, "lng": 77.6408, "category": "Metro Station", "benefit": "Saves 1.2 kg CO₂ per trip vs personal car"},
            {"name": "Whitefield EV Charging Station ⚡", "lat": 12.9698, "lng": 77.7500, "category": "EV Charging", "benefit": "Powers clean corporate commutes"}
        ]
    }
}

DEFAULT_MAP = {
    "lat": 20.5937,
    "lng": 78.9629,
    "spots": [
        {"name": "Central Eco Park 🌳", "lat": 20.6000, "lng": 78.9700, "category": "Park", "benefit": "Urban greenery carbon offset"},
        {"name": "Green Transit Bus Stop 🚌", "lat": 20.5900, "lng": 78.9500, "category": "Bus Stop", "benefit": "CNG and Electric Bus lines connection"},
        {"name": "Solar Powered EV Charging ⚡", "lat": 20.5850, "lng": 78.9600, "category": "EV Charging", "benefit": "100% solar powered vehicle charging station"}
    ]
}

@router.get("/green-spots", response_model=GreenSpotsResponse)
def get_green_spots(city: str) -> GreenSpotsResponse:
    """
    Retrieve green spots map and markers list for a city.

    Args:
        city: The name of the city.

    Returns:
        GreenSpotsResponse listing green spots and center coordinates.
    """
    city_key = city.strip().lower()
    map_data = CITY_MAPS.get(city_key, {
        "lat": DEFAULT_MAP["lat"] + (random.random() * 0.1 - 0.05) if city_key else DEFAULT_MAP["lat"],
        "lng": DEFAULT_MAP["lng"] + (random.random() * 0.1 - 0.05) if city_key else DEFAULT_MAP["lng"],
        "spots": DEFAULT_MAP["spots"]
    })
    
    return GreenSpotsResponse(
        city=city.title(),
        lat=map_data["lat"],
        lng=map_data["lng"],
        spots=[SpotItem(**s) for s in map_data["spots"]]
    )
