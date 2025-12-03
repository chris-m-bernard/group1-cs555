// src/lib/meal-ai.ts
export type AnalyzeMealResponse = {
  detections: {
    bbox: number[];
    food: string;
    confidence: number;
    all_predictions: [string, number][];
    crop_type: string;
  }[];
  macros: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
  per_item: {
    food: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  }[];
  source: string;
};

const AI_BASE_URL =
  import.meta.env.VITE_AI_SERVICE_URL ?? "http://localhost:8000";

export async function analyzeMealImage(
  imageUrl: string,
  title: string
): Promise<AnalyzeMealResponse> {
  const res = await fetch(`${AI_BASE_URL}/analyze-meal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageUrl, title }),
  });

  if (!res.ok) {
    throw new Error(`AI service error: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as AnalyzeMealResponse;
}
