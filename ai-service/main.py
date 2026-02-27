from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from google import genai
import json
import os
import re
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="thisWay AI Service")

# CORS origins: comma-separated in ALLOWED_ORIGINS env var, falls back to localhost
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))


# ── Security ──────────────────────────────────────────────────────────────
@app.middleware("http")
async def verify_secret(request: Request, call_next):
    if request.url.path in ["/", "/health"]:
        return await call_next(request)
    secret = request.headers.get("X-Internal-Secret")
    if secret != os.getenv("INTERNAL_SECRET"):
        raise HTTPException(status_code=401, detail="Unauthorized")
    return await call_next(request)


# ── Models ────────────────────────────────────────────────────────────────
class ItineraryRequest(BaseModel):
    destination: str
    startDate: str
    endDate: str
    budget: Optional[float] = None
    currency: Optional[str] = "USD"
    travelers: int = 1
    interests: List[str] = []
    travelStyle: Optional[str] = "balanced"
    # Traveler context (Step 0)
    fromLocation: Optional[str] = None
    alreadyThere: Optional[bool] = False
    arrivalTime: Optional[str] = "unknown"
    energyLevel: Optional[str] = "medium"


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    trip_context: dict
    current_itinerary: Optional[dict] = None
    history: List[ChatMessage] = []


# ── Helpers ───────────────────────────────────────────────────────────────
def get_dates_between(start: str, end: str) -> List[str]:
    """Return list of date strings from start to end inclusive."""
    from datetime import date, timedelta
    s = datetime.strptime(start, "%Y-%m-%d").date()
    e = datetime.strptime(end, "%Y-%m-%d").date()
    dates = []
    current = s
    while current <= e:
        dates.append(str(current))
        current += timedelta(days=1)
    return dates


CURRENCY_SYMBOLS = {
    "USD": "$", "INR": "₹", "EUR": "€",
    "GBP": "£", "JPY": "¥", "AUD": "A$",
    "CAD": "C$", "SGD": "S$"
}


# ── Health Routes ─────────────────────────────────────────────────────────
@app.get("/")
def health():
    return {"status": "ok", "service": "Wandr AI Service"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


# ── Generate Itinerary ────────────────────────────────────────────────────
@app.post("/generate-itinerary")
async def generate_itinerary(req: ItineraryRequest):
    interests_str = ", ".join(req.interests) if req.interests else "general sightseeing"
    currency = req.currency or "USD"
    symbol = CURRENCY_SYMBOLS.get(currency, "$")
    budget_str = f"{symbol}{req.budget:,.0f} {currency}" if req.budget else "flexible"

    # Calculate exact dates
    dates = get_dates_between(req.startDate, req.endDate)
    total_days = len(dates)

    # Build date entries for the prompt
    date_entries = "\n".join([f"  Day {i+1}: {d}" for i, d in enumerate(dates)])

    # Build traveler context string
    if req.alreadyThere:
        travel_context = "Traveler is ALREADY at the destination. No travel day needed. Start activities from morning of Day 1."
    else:
        from_loc = req.fromLocation or "unknown location"
        arrival_map = {
            "morning": "morning (before noon) — Day 1 has a FULL day available",
            "afternoon": "afternoon (noon–5pm) — Day 1 has a HALF day available, schedule 2–3 light activities max",
            "evening": "evening (5pm–9pm) — Day 1 should only include dinner and hotel check-in, NO sightseeing",
            "night": "night (after 9pm) — Day 1 is ARRIVAL ONLY. Just hotel check-in and rest. No activities.",
            "unknown": "unknown time — treat Day 1 as a LIGHT arrival day with only 1–2 optional activities after 3pm"
        }
        arrival_desc = arrival_map.get(req.arrivalTime or "unknown", arrival_map["unknown"])
        travel_context = f"""Traveler is flying/traveling FROM {from_loc} TO {req.destination}.
- Arrival time: {arrival_desc}
- IMPORTANT: Day 1 activities must reflect this arrival time. Do NOT schedule a full day if arriving late.
- Allow realistic buffer for airport → hotel transfer (at least 1–1.5 hours)."""

    energy_map = {
        "low": "Low energy — keep daily activities to 2–3 max, include rest periods, avoid back-to-back intense activities",
        "medium": "Medium energy — balanced days with 3–4 activities and natural rest breaks",
        "high": "High energy — can handle 5–6 activities per day, packed schedule is fine"
    }
    energy_context = energy_map.get(req.energyLevel or "medium", energy_map["medium"])

    prompt = f"""You are a professional travel planner. Create a realistic, physically possible travel itinerary.

TRIP DETAILS:
- Destination: {req.destination}
- Start: {req.startDate}, End: {req.endDate}
- TOTAL DAYS: {total_days} (this is exact — do not add or remove days)
- Travelers: {req.travelers}
- Budget: {budget_str} (use {currency} for ALL costs, symbol {symbol})
- Interests: {interests_str}
- Travel style: {req.travelStyle}

TRAVELER CONTEXT (very important for realistic scheduling):
- {travel_context}
- Energy level: {energy_context}

EXACT DAYS TO GENERATE (use these exact dates):
{date_entries}

STRICT RULES — you MUST follow all of these:
1. Generate EXACTLY {total_days} day(s). Not more, not less.
2. All prices and costs MUST be in {currency} using symbol {symbol}. Never use $ if currency is not USD.
3. The estimated_cost must be realistic for {req.travelers} traveler(s) with a {budget_str} budget.
4. Day 1 MUST reflect the arrival time — do not over-schedule if arriving late.
5. Activities must respect energy level — a low energy traveler should not have 6 activities/day.
6. Each day: activities only between 07:00 and 22:00 local time. Allow meal breaks.
7. If budget is low, include free activities, street food, and public transport.
8. Add small human notes like "We kept this day lighter so you don't burn out" when relevant.

Return ONLY valid JSON, no markdown, no extra text:
{{
  "destination": "{req.destination}",
  "total_days": {total_days},
  "currency": "{currency}",
  "summary": "One sentence overview of this trip",
  "estimated_cost": 0,
  "days": [
    {{
      "day_number": 1,
      "date": "{dates[0]}",
      "theme": "Day theme",
      "activities": [
        {{
          "title": "Activity name",
          "description": "2-3 sentence description",
          "location": "Specific place name",
          "start_time": "09:00",
          "end_time": "11:00",
          "category": "attraction",
          "estimated_cost": 20,
          "tips": "Practical insider tip"
        }}
      ]
    }}
  ]
}}"""

    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )

        raw = (response.text or "").strip()
        raw = re.sub(r'^```(?:json)?\s*', '', raw)
        raw = re.sub(r'\s*```$', '', raw.strip())

        data = json.loads(raw)

        # Enforce correct day count and dates server-side
        if "days" in data:
            data["days"] = data["days"][:total_days]
            for i, day in enumerate(data["days"]):
                day["day_number"] = i + 1
                day["date"] = dates[i]

        data["total_days"] = total_days
        data["currency"] = currency

        return data

    except Exception as e:
        return {
            "error": "AI generation failed",
            "details": str(e)
        }


# ── Chat Endpoint ─────────────────────────────────────────────────────────
@app.post("/chat")
async def chat(req: ChatRequest):
    ctx = req.trip_context
    history_text = "\n".join([f"{m.role}: {m.content}" for m in req.history[-10:]])
    currency = ctx.get("currency", "USD")
    symbol = CURRENCY_SYMBOLS.get(currency, "$")

    prompt = f"""You are Wandr's friendly AI travel assistant.
Trip: {ctx.get('destination')} | {ctx.get('startDate')} to {ctx.get('endDate')} | {ctx.get('travelers', 1)} traveler(s)
Currency: {currency} ({symbol})

Conversation:
{history_text}

User: {req.message}

Reply helpfully and concisely. Use {currency} for any costs."""

    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        return {
            "response": response.text,
            "itinerary_update": None
        }
    except Exception as e:
        return {
            "response": "Sorry, something went wrong.",
            "error": str(e)
        }
