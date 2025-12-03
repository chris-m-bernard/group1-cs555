# ai-service/app.py
import os
import json
import base64
from io import BytesIO
from typing import Optional

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
    imageUrl: Optional[str] = None            # http(s) URL
    imageBase64: Optional[str] = None         # may be raw base64 OR data URL
    imageData: Optional[str] = Field(         # also accept data URL here
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
            mime = header[5:header.index(";base64")]  # between 'data:' and ';base64'
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


# ---------- Route ----------

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
        raise HTTPException(status_code=500, detail="Failed to analyze meal")
