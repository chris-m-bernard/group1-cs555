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

/* ------------------------------------------------------------------ */
/*  Recipe recommendations                                             */
/* ------------------------------------------------------------------ */

// What the backend returns for each recipe
export type AIRecipe = {
  title: string;
  description: string;
  ingredients: string[];
  steps: string[];
  estimated_calories?: number;
  tags?: string[];
};

type RecommendMealsResponse = {
  recipes: AIRecipe[];
};

// Shape of the meals we accept from the app when generating recs
export type PastMealForAI = {
  title: string;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  tags?: string[]; // optional, for later if you add them
};

/**
 * Call the FastAPI /recommend-meals endpoint to generate
 * 3 new recipes based on the user's past meals.
 */
export async function generateMealRecommendationsFromMeals(
  meals: PastMealForAI[]
): Promise<AIRecipe[]> {
  const payload = {
    meals: meals.map((m) => ({
      title: m.title,
      calories: m.calories ?? null,
      protein_g: m.protein ?? null,
      carbs_g: m.carbs ?? null,
      fat_g: m.fat ?? null,
      tags: m.tags ?? [],
    })),
  };

  const res = await fetch(`${AI_BASE_URL}/recommend-meals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(
      `AI recommendation service error: ${res.status} ${res.statusText}`
    );
  }

  const data = (await res.json()) as RecommendMealsResponse;
  return data.recipes;
}
