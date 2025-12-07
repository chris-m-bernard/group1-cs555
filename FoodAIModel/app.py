# ai-service/app.py
import os
import json
import base64
from io import BytesIO
from typing import Optional
import traceback

import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from PIL import Image

import google.generativeai as genai
from macrovisionai import analyze_food

# --- Configure Gemini ---
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError("GEMINI_API_KEY is not set. Set it in .env or env vars.")

genai.configure(api_key=api_key)
gemini_model = genai.GenerativeModel("gemini-2.5-flash")

recommend_model = genai.GenerativeModel(
    "gemini-2.5-flash",
    generation_config={"response_mime_type": "application/json"},
)

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Pydantic models ----------


class AnalyzeMealRequest(BaseModel):
    # Any of these is fine; at least one must be provided
    imageUrl: Optional[str] = None  # http(s) URL
    imageBase64: Optional[str] = None  # may be raw base64 OR data URL
    imageData: Optional[str] = Field(  # also accept data URL here
        default=None,
        description="Data URL style base64 image, e.g. data:image/jpeg;base64,...",
    )
    title: Optional[str] = None


class MacroBreakdown(BaseModel):
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float


class AnalyzeMealResponse(BaseModel):
    detections: list[dict]
    macros: MacroBreakdown
    per_item: list[dict]
    source: str


class PastMeal(BaseModel):
    title: str
    calories: Optional[float] = None
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None
    tags: Optional[list[str]] = None  # ["high protein", "vegetarian"]


class RecommendMealsRequest(BaseModel):
    meals: list[PastMeal]


class RecipeRecommendation(BaseModel):
    title: str
    description: str
    ingredients: list[str]
    steps: list[str]
    estimated_calories: Optional[int] = None
    tags: Optional[list[str]] = None


class RecommendMealsResponse(BaseModel):
    recipes: list[RecipeRecommendation]


# ---------- Helpers ----------


def download_image_bytes(url: str) -> bytes:
    resp = requests.get(url)
    resp.raise_for_status()
    return resp.content


def _decode_base64_maybe_data_url(b64_or_data_url: str) -> tuple[bytes, Optional[str]]:
    """
    Accepts either:
      - plain base64 string
      - or data URL: 'data:image/avif;base64,AAAA...'

    Returns: (raw_bytes, mime_type_if_known)
    """
    mime = None
    s = b64_or_data_url.strip()

    if s.startswith("data:"):
        header, _, b64_part = s.partition(",")
        # header like "data:image/avif;base64"
        if ";base64" in header:
            mime = header[5 : header.index(";base64")]  # between 'data:' and ';base64'
        s = b64_part

    try:
        raw_bytes = base64.b64decode(s)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image data")

    return raw_bytes, mime


def get_image_bytes_and_mime(req: AnalyzeMealRequest) -> tuple[bytes, str]:
    """
    Returns (image_bytes, mime_type).
    - If imageUrl is given, we download it.
    - Otherwise we decode base64 from imageBase64 or imageData.
    - If mime is not jpeg/png/webp, we convert to JPEG for Gemini.
    """
    raw_bytes: bytes
    mime: Optional[str] = None

    # Case 1: URL
    if req.imageUrl:
        raw_bytes = download_image_bytes(req.imageUrl)
        lower = req.imageUrl.lower()
        if lower.endswith(".png"):
            mime = "image/png"
        elif lower.endswith(".webp"):
            mime = "image/webp"
        elif lower.endswith(".jpg") or lower.endswith(".jpeg"):
            mime = "image/jpeg"
        elif lower.endswith(".avif"):
            mime = "image/avif"
        else:
            mime = "image/jpeg"  # fallback

    # Case 2: base64 / data URL
    else:
        if req.imageBase64:
            raw_bytes, mime_from_data = _decode_base64_maybe_data_url(req.imageBase64)
        elif req.imageData:
            raw_bytes, mime_from_data = _decode_base64_maybe_data_url(req.imageData)
        else:
            raise HTTPException(
                status_code=400,
                detail="Must provide imageUrl or imageBase64/imageData.",
            )

        if mime is None:
            mime = mime_from_data or "image/jpeg"

    # Normalize to Gemini-friendly mime
    supported = {"image/jpeg", "image/png", "image/webp"}
    if mime not in supported:
        # Convert to JPEG
        try:
            img = Image.open(BytesIO(raw_bytes))
            out = BytesIO()
            img.convert("RGB").save(out, format="JPEG")
            raw_bytes = out.getvalue()
            mime = "image/jpeg"
        except Exception as e:
            print("Failed to convert image to JPEG:", e)
            # best effort fallback
            mime = "image/jpeg"

    # Small debug log to confirm what we’re sending
    print(f"[analyze-meal] mime={mime}, bytes_len={len(raw_bytes)}")

    return raw_bytes, mime


def _extract_json_from_gemini(text: str) -> dict:
    """
    Try very hard to get a JSON object out of Gemini's response text.
    1) Direct json.loads
    2) Extract first ```json ... ``` block
    3) Extract largest {...} block that contains "recipes"
    Raises ValueError if it can't parse.
    """
    # 1) Direct attempt
    try:
        return json.loads(text)
    except Exception:
        pass

    # 2) Look for ```json ... ``` fenced code block
    start = text.find("```json")
    if start != -1:
        end = text.find("```", start + len("```json"))
        if end != -1:
            inner = text[start + len("```json") : end].strip()
            try:
                return json.loads(inner)
            except Exception:
                pass

    # 3) Look for the largest {...} that contains "recipes"
    first_brace = text.find("{")
    last_brace = text.rfind("}")
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        candidate = text[first_brace : last_brace + 1]
        if '"recipes"' in candidate:
            try:
                return json.loads(candidate)
            except Exception:
                pass

    # If we reach here, parsing failed
    raise ValueError("Could not extract JSON from Gemini response")


# ---------- Routes ----------


@app.post("/analyze-meal", response_model=AnalyzeMealResponse)
def analyze_meal(req: AnalyzeMealRequest):
    try:
        # 1) Get image bytes + mime (from URL or base64/data URL)
        img_bytes, mime_type = get_image_bytes_and_mime(req)

        # 2) Run MacroVision if we have a real URL; otherwise skip
        if req.imageUrl:
            detections = analyze_food(req.imageUrl, conf_threshold=0.2)
        else:
            detections = []

        # 3) Build prompt for Gemini
        prompt = f"""
You are a nutrition assistant.

A separate vision model has detected the following items in the meal image
(detections may be empty if no URL was provided):

{json.dumps(detections, indent=2)}

User's meal title: "{req.title or ""}"

Your task:
1. Use these detections and the image to estimate realistic macros.
2. Assume typical restaurant/college-student portions unless the image clearly shows otherwise.
3. Return ONLY this JSON object (no explanation text):

{{
  "calories": number,
  "protein_g": number,
  "carbs_g": number,
  "fat_g": number,
  "per_item": [
    {{
      "food": string,
      "calories": number,
      "protein_g": number,
      "carbs_g": number,
      "fat_g": number
    }}
  ]
}}
"""

        # 4) Call Gemini with **raw bytes**, not manual base64
        response = gemini_model.generate_content(
            [
                {
                    "inline_data": {
                        "mime_type": mime_type,
                        "data": img_bytes,
                    }
                },
                {"text": prompt},
            ]
        )

        text = response.text

        # Extract JSON block
        start = text.index("{")
        end = text.rindex("}") + 1
        macros_json = json.loads(text[start:end])

        return AnalyzeMealResponse(
            detections=detections,
            macros=MacroBreakdown(
                calories=macros_json["calories"],
                protein_g=macros_json["protein_g"],
                carbs_g=macros_json["carbs_g"],
                fat_g=macros_json["fat_g"],
            ),
            per_item=macros_json.get("per_item", []),
            source="macrovision+gemini",
        )

    except HTTPException:
        raise
    except Exception as e:
        print("Error analyzing meal:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to analyze meal")


@app.post("/recommend-meals", response_model=RecommendMealsResponse)
def recommend_meals(req: RecommendMealsRequest):
    """
    Generate 3 new recipe recommendations based on the user's past meals.
    """

    # Build a human-readable summary of past meals for the prompt
    if req.meals:
        meals_text_lines = []
        for m in req.meals:
            macros = []
            if m.calories is not None:
                macros.append(f"cal: {m.calories}")
            if m.protein_g is not None:
                macros.append(f"P: {m.protein_g}g")
            if m.carbs_g is not None:
                macros.append(f"C: {m.carbs_g}g")
            if m.fat_g is not None:
                macros.append(f"F: {m.fat_g}g")

            macros_str = ", ".join(macros) if macros else "macros: unknown"
            tags_str = f"tags: {m.tags}" if m.tags else "tags: []"
            meals_text_lines.append(f"- {m.title} ({macros_str}; {tags_str})")

        meals_text = "\n".join(meals_text_lines)
    else:
        meals_text = "No past meals provided."

    prompt = f"""
You are a nutrition-aware recipe assistant helping a college student.

The user has eaten meals like:
{meals_text}

Based on their past meals, suggest 3 NEW recipes that:
- Are realistic for a college student (simple, affordable ingredients)
- Are reasonably balanced (protein, carbs, and some healthy fats)
- Do NOT exactly repeat any previous meals, but keep a similar general style and preferences
- Include estimated calories for each full recipe

Return ONLY a valid JSON object in this exact structure. Do not include triple backticks or any markdown:

{{
  "recipes": [
    {{
      "title": "string",
      "description": "short overview of the meal",
      "ingredients": ["ingredient 1", "ingredient 2", "..."],
      "steps": ["step 1", "step 2", "..."],
      "estimated_calories": 600,
      "tags": ["high protein", "easy", "dinner"]
    }},
    {{
      "title": "string",
      "description": "short overview",
      "ingredients": ["..."],
      "steps": ["..."],
      "estimated_calories": 500,
      "tags": ["..."]
    }},
    {{
      "title": "string",
      "description": "short overview",
      "ingredients": ["..."],
      "steps": ["..."],
      "estimated_calories": 700,
      "tags": ["..."]
    }}
  ]
}}
"""

    try:
        # Use the JSON-mode model
        response = recommend_model.generate_content(prompt)
        text = response.text.strip()
    except Exception as e:
        print("Error calling Gemini for recommendations:", e)
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Failed to generate recommendations from AI model",
        )

    # Safety: strip accidental ``` fences if they appear directly
    if text.startswith("```"):
        t = text.strip()
        if t.startswith("```json"):
            t = t[len("```json") :].strip()
        elif t.startswith("```"):
            t = t[3:].strip()
        if t.endswith("```"):
            t = t[:-3].strip()
        text = t

    # -------- Robust JSON parsing with helper + fallback --------
    try:
        data = _extract_json_from_gemini(text)
    except Exception as e:
        print("JSON parse error for recommendations:", e)
        print("Raw response from Gemini (truncated to 1000 chars):")
        print(text[:1000])
        traceback.print_exc()

        # LAST RESORT FALLBACK: static recipes so the UI still works
        fallback_recipes = [
            {
                "title": "Quick Veggie Pasta",
                "description": "A simple one-pan pasta with veggies and olive oil.",
                "ingredients": [
                    "80g dry pasta",
                    "1 cup mixed frozen vegetables",
                    "1 tbsp olive oil",
                    "1 clove garlic, minced",
                    "Salt and pepper to taste",
                ],
                "steps": [
                    "Cook pasta according to package instructions.",
                    "In a pan, sauté garlic in olive oil, then add frozen veggies and cook until heated through.",
                    "Toss cooked pasta with the veggies, season with salt and pepper, and serve.",
                ],
                "estimated_calories": 600,
                "tags": ["easy", "college-friendly", "vegetarian"],
            },
            {
                "title": "Chicken & Rice Bowl",
                "description": "Simple chicken, rice, and veggies bowl for a balanced meal.",
                "ingredients": [
                    "1 cup cooked rice",
                    "120g cooked chicken breast, sliced",
                    "1/2 cup steamed broccoli",
                    "1 tbsp soy sauce",
                ],
                "steps": [
                    "Add rice to a bowl.",
                    "Top with cooked chicken and steamed broccoli.",
                    "Drizzle soy sauce over the top and serve.",
                ],
                "estimated_calories": 650,
                "tags": ["high protein", "dinner", "balanced"],
            },
            {
                "title": "Yogurt Parfait",
                "description": "Quick breakfast with yogurt, fruit, and granola.",
                "ingredients": [
                    "1 cup Greek yogurt",
                    "1/2 cup mixed berries",
                    "1/4 cup granola",
                ],
                "steps": [
                    "Add yogurt to a bowl or cup.",
                    "Top with berries and granola.",
                    "Serve immediately.",
                ],
                "estimated_calories": 400,
                "tags": ["breakfast", "quick", "high protein"],
            },
        ]

        typed_fallback = [RecipeRecommendation(**r) for r in fallback_recipes]
        return RecommendMealsResponse(recipes=typed_fallback)

    # Normal path if parsing succeeded
    recipes = data.get("recipes")
    if not isinstance(recipes, list) or len(recipes) == 0:
        raise HTTPException(status_code=500, detail="AI did not return any recipes")

    # Force exactly 3 recipes max
    recipes = recipes[:3]

    typed_recipes = [RecipeRecommendation(**r) for r in recipes]

    return RecommendMealsResponse(recipes=typed_recipes)
