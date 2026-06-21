# pyrefly: ignore [missing-import]
import google.generativeai as genai
import os

# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY, transport='rest')

model = genai.GenerativeModel(
    model_name="gemini-2.5-flash",
    system_instruction="""You are Eco Mitra, a friendly 
    sustainability assistant for Indian users. ALWAYS 
    respond in Hinglish only — natural Hindi + English 
    mix using Roman script. Be warm, encouraging, 
    practical. Give tips relevant to Indian lifestyle. 
    Keep responses under 120 words. Use 1-2 emojis max."""
)

async def get_eco_mitra_response(
    user_message: str, 
    user_context: Optional[dict] = None
) -> str:
    """
    Generate a Hinglish response from Eco Mitra based on user message and context.

    Args:
        user_message: The query or message from the user.
        user_context: Optional dictionary containing today's carbon footprints.

    Returns:
        Hinglish response string from Gemini.
    """
    try:
        context_str = ""
        if user_context:
            context_str = f"""
User ka aaj ka data:
- Total CO2: {user_context.get('total_co2', 'N/A')} kg
- Transport: {user_context.get('transport', 'N/A')} kg
- Khana: {user_context.get('food', 'N/A')} kg  
- Bijli: {user_context.get('energy', 'N/A')} kg
- Kachra: {user_context.get('waste', 'N/A')} kg
Is data ko dhyan mein rakh ke jawab do.
"""
        full_message = context_str + "\nUser: " + user_message
        response = model.generate_content(full_message)
        return response.text
    except Exception as e:
        print(f"Gemini error: {e}")
        return ("Eco Mitra abhi thoda busy hai! "
                "Par aapka sapna green India banana "
                "bahut achha hai 🌿 Thodi der mein "
                "try karo!")

# Helper fallback data for challenges and reports
WEEKLY_REPORT_PROMPT_TEMPLATE = (
    "Given this user's 7-day carbon data:\n{data}\n\n"
    "Write a warm, encouraging weekly sustainability report in Hinglish "
    "(200 words max). Mention what they did well, what to improve, "
    "and 3 specific actionable tips for next week. Use emojis sparingly."
)

CHALLENGE_PROMPT_TEMPLATE = (
    "User ka weakest carbon category hai: {category}. "
    "User ka aaj ka total carbon footprint hai: {total_co2} kg CO2.\n\n"
    "Generate exactly 3 daily eco-friendly challenges in Hinglish for this user. "
    "Each challenge should:\n"
    "1. Be specific and actionable for Indian lifestyle\n"
    "2. Include approximate CO2 saving in kg\n"
    "3. Be fun and encouraging\n"
    "4. Be under 50 words each\n\n"
    "Format: Return exactly 3 lines, each in format:\n"
    "CATEGORY|CHALLENGE_TEXT|CO2_SAVING_KG\n"
    "Categories: transport, food, energy, waste\n"
    "Example: food|Aaj ghar ka khana khao, delivery mat lo! 2.3 kg CO2 bachega 🍛|2.3"
)

FALLBACK_CHALLENGES = [
    {
        "category": "transport",
        "text": "Aaj 2 km cycle chalao ya paidal jao 🚴",
        "co2_saving": 0.42,
    },
    {
        "category": "food",
        "text": "Aaj ghar ka khana khao, delivery mat lo! 2.3 kg CO2 bachega 🍛",
        "co2_saving": 2.3,
    },
    {
        "category": "energy",
        "text": "AC 1 ghante kam chalao aaj 🌬️",
        "co2_saving": 1.2,
    },
]

async def generate_weekly_report(weekly_data: str) -> str:
    """
    Generate a Hinglish weekly sustainability report based on weekly data.

    Args:
        weekly_data: String description of the user's weekly carbon emissions.

    Returns:
        Weekly sustainability report text in Hinglish.
    """
    if not GEMINI_API_KEY:
        return (
            "Is hafte aapne kaafi acha kiya! 🌿 "
            "Aapka average carbon footprint control mein hai. "
            "Agale hafte ke liye tips:\n"
            "1. Public transport zyada use karo 🚌\n"
            "2. Ghar ka khana khao, delivery kam karo 🍛\n"
            "3. AC ka use 1 ghanta kam karo ❄️\n"
            "Keep going, Carbon Crusher! 💪"
        )
    try:
        report_model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=(
                "Respond in Hinglish only — a natural mix of Hindi and English "
                "using Roman script. Be friendly, warm, and encouraging."
            ),
        )
        prompt = WEEKLY_REPORT_PROMPT_TEMPLATE.format(data=weekly_data)
        response = report_model.generate_content(prompt)
        return response.text.strip()
    except Exception:
        return (
            "Is hafte aapne kaafi acha kiya! 🌿 "
            "Report abhi available nahi hai, thodi der baad try karo."
        )

async def generate_daily_challenges(weakest_category: str, total_co2: float) -> list[dict]:
    """
    Generate exactly 3 daily eco-friendly challenges in Hinglish for a user.

    Args:
        weakest_category: The category where the user has the highest emissions.
        total_co2: The total carbon footprint of the user today.

    Returns:
        List of challenge dictionaries.
    """
    if not GEMINI_API_KEY:
        return FALLBACK_CHALLENGES
    try:
        challenge_model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=(
                "Respond in Hinglish only — a natural mix of Hindi and English "
                "using Roman script. Be friendly, warm, and encouraging. "
                "Follow the exact format requested."
            ),
        )
        prompt = CHALLENGE_PROMPT_TEMPLATE.format(
            category=weakest_category,
            total_co2=total_co2,
        )
        response = challenge_model.generate_content(prompt)
        lines = response.text.strip().split("\n")
        challenges = []
        for line in lines:
            line = line.strip()
            if not line or "|" not in line:
                continue
            parts = line.split("|")
            if len(parts) >= 3:
                try:
                    challenges.append({
                        "category": parts[0].strip().lower(),
                        "text": parts[1].strip(),
                        "co2_saving": float(parts[2].strip()),
                    })
                except (ValueError, IndexError):
                    continue
            if len(challenges) == 3:
                break
        if len(challenges) < 3:
            return FALLBACK_CHALLENGES
        return challenges
    except Exception:
        return FALLBACK_CHALLENGES

chat_with_eco_mitra = get_eco_mitra_response


async def chat_with_eco_mitra_agent(
    user_message: str,
    user_context_str: Optional[str] = None
) -> tuple[str, str, bool, dict, str]:
    """
    Chat with the Eco Mitra Carbon Logging Agent to parse activities and update context.

    Args:
        user_message: The raw natural language message from the user.
        user_context_str: Optional JSON string of the current logging context.

    Returns:
        Tuple containing reply, intent, show_confirmation flag, updated pending activities, and new context string.
    """
    import json

    # 1. Parse current context
    context = {}
    if user_context_str:
        try:
            context = json.loads(user_context_str)
        except Exception:
            context = {}

    pending = context.get("pending_activities") or {
        "transport": {
            "car_km": 0.0,
            "bike_km": 0.0,
            "bus_km": 0.0,
            "train_km": 0.0,
            "auto_km": 0.0,
            "walk_km": 0.0
        },
        "food": {
            "nonveg_meals": 0,
            "veg_meals": 0,
            "packaged_meals": 0,
            "homemade_meals": 0
        },
        "energy": {
            "ac_hours": 0.0,
            "geyser_hours": 0.0,
            "washing_loads": 0,
            "fan_lights_hours": 0.0
        },
        "waste": {
            "plastic_items": 0,
            "delivery_orders": 0,
            "recycling_done": False
        }
    }

    missing_info = context.get("missing_info") or []

    # 2. Build the prompt
    prompt = f"""
You are the Eco Mitra Carbon Logging Agent.
Your job is to help users log their daily carbon activities using natural language.
The user can speak in English, Hindi, or Hinglish (Hindi written in Roman script).

You support the following activity schema:
- transport:
  - car_km (float): distance traveled in a petrol/diesel car in km
  - bike_km (float): distance traveled in a motorcycle/scooter in km
  - bus_km (float): distance traveled in a bus in km
  - train_km (float): distance traveled in a train in km
  - auto_km (float): distance traveled in an auto-rickshaw in km
  - walk_km (float): distance traveled by walking or cycling in km
- food:
  - nonveg_meals (int): number of non-vegetarian meals eaten (e.g. chicken burger, meat, fish, etc.)
  - veg_meals (int): number of vegetarian meals eaten (e.g. dal chawal, paneer, etc.)
  - packaged_meals (int): number of packaged/processed food meals (e.g. chips, instant noodles, biscuits)
  - homemade_meals (int): number of homemade/simple meals
- energy:
  - ac_hours (float): number of hours AC (Air Conditioner) was run
  - geyser_hours (float): number of hours geyser/water heater was run
  - washing_loads (int): number of washing machine loads run
  - fan_lights_hours (float): number of hours fans and lights were kept on
- waste:
  - plastic_items (int): number of single-use plastic items used
  - delivery_orders (int): number of online delivery orders (packaged box, bag)
  - recycling_done (bool): whether they segregated waste or composted/recycled

Current state of logged activities:
{json.dumps(pending, indent=2)}

List of fields currently marked as having missing info:
{json.dumps(missing_info, indent=2)}

User's message: "{user_message}"

Follow these rules:
1. Determine if the user message is about logging daily carbon footprint activities (e.g. transport km, AC hours, meals eaten, waste recycled) or if it is just general chat/questions.
   - If it is general chat/questions, set "intent" to "chat", set "pending_activities" to null, and write a warm Hinglish reply in "reply". Set "show_confirmation" to false.
   - If it is about logging activities, set "intent" to "log_activity".
2. If "intent" is "log_activity":
   - Parse all mentioned activities and their quantities. Merge/update them into the "pending_activities" state.
   - If the user provides a quantity for a field that was previously missing (e.g., they reply to a follow-up question like "20 km" or "4 hours"), update that field in "pending_activities" and remove it from missing_info.
   - Check if there are any fields mentioned by the user that are missing quantities (e.g., they say "travel by train" but don't specify the km, or "AC chalaya" but no hours).
     - If so, add it to the "missing_info" list. Each entry in "missing_info" should have "field" (e.g. "transport.train_km") and a friendly Hinglish follow-up question in "prompt".
     - Only ask about fields they explicitly mentioned or that are directly related to the user's input. Do NOT ask about other categories (like food/energy/waste) if they didn't bring them up.
   - If "missing_info" is empty, set "show_confirmation" to true.
   - Set "reply" to a friendly Hinglish response. If there are missing fields, ask the first missing field's prompt. If everything is complete, tell them to confirm the card.

Respond ONLY with a valid JSON object matching this structure:
{{
  "intent": "chat" | "log_activity",
  "reply": "your Hinglish response",
  "pending_activities": {{ ... updated pending activities matching the schema ... }},
  "missing_info": [ {{ "field": "category.fieldname", "prompt": "follow up question" }} ],
  "show_confirmation": true | false
}}
"""

    models_to_try = [
        "gemini-3.5-flash",
        "gemini-3-flash-preview",
        "gemini-3.1-flash-lite",
        "gemini-flash-lite-latest",
    ]

    response_text = None
    for model_name in models_to_try:
        try:
            m = genai.GenerativeModel(model_name)
            response = m.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            response_text = response.text.strip()
            if response_text:
                break
        except Exception as e:
            print(f"Agent fallback try for {model_name} failed: {e}")
            continue

    if not response_text:
        fallback_reply = "Eco Mitra ka system abhi thoda busy hai, thodi der baad try karein!"
        return fallback_reply, "chat", False, pending, json.dumps({
            "pending_activities": pending,
            "missing_info": missing_info
        })

    try:
        res_json = json.loads(response_text)
        intent = res_json.get("intent", "chat")
        reply = res_json.get("reply", "Kuch samajh nahi aaya, dobara bolo!")
        show_confirmation = res_json.get("show_confirmation", False)
        updated_pending = res_json.get("pending_activities") or pending
        updated_missing = res_json.get("missing_info") or []

        new_context = json.dumps({
            "pending_activities": updated_pending,
            "missing_info": updated_missing
        })

        return reply, intent, show_confirmation, updated_pending, new_context
    except Exception as e:
        print(f"Error parsing agent response JSON: {e}")
        fallback_reply = "Kuch error aayi parsing mein. Dobara try karo!"
        return fallback_reply, "chat", False, pending, json.dumps({
            "pending_activities": pending,
            "missing_info": missing_info
        })


