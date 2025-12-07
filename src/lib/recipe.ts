// src/lib/recipe.ts
import { auth, db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import type { AIRecipe } from "./meal-ai";

/**
 * Firestore representation of a recipe document.
 * Uses the same fields as AIRecipe plus id/source/createdAt.
 */
export type Recipe = AIRecipe & {
  id: string;
  source?: "ai" | "manual";
  createdAt?: any;
};

/**
 * Input type when saving a recipe (e.g., favorite or manual).
 */
export type RecipeInput = AIRecipe & {
  source?: "ai" | "manual";
};

/**
 * List the current user's latest recipe recommendations
 * from Firestore (users/{uid}/recipeRecommendations).
 */
export async function listRecipeRecommendationsForCurrentUser(): Promise<
  Recipe[]
> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("You must be logged in to list recipe recommendations.");
  }

  const recsRef = collection(db, "users", user.uid, "recipeRecommendations");
  const q = query(recsRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  const recipes: Recipe[] = [];
  snap.forEach((docSnap) => {
    const data = docSnap.data() as any;
    recipes.push({
      id: docSnap.id,
      title: data.title,
      description: data.description ?? "",
      ingredients: data.ingredients ?? [],
      steps: data.steps ?? [],
      estimated_calories: data.estimated_calories ?? undefined,
      tags: data.tags ?? [],
      source: data.source ?? "ai",
      createdAt: data.createdAt,
    });
  });

  return recipes;
}

/**
 * Replace the current user's recipe recommendations with a new set
 * of AI-generated recipes.
 *
 * Used when the user clicks "Generate new recipes".
 */
export async function replaceRecipeRecommendationsForCurrentUser(
  aiRecipes: AIRecipe[]
): Promise<Recipe[]> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("You must be logged in to save recipe recommendations.");
  }

  const recsRef = collection(db, "users", user.uid, "recipeRecommendations");

  // Delete any existing recommendations first
  const existing = await getDocs(recsRef);
  await Promise.all(existing.docs.map((d) => deleteDoc(d.ref)));

  // Add the new ones
  const saved: Recipe[] = [];
  for (const r of aiRecipes) {
    const docRef = await addDoc(recsRef, {
      title: r.title,
      description: r.description,
      ingredients: r.ingredients ?? [],
      steps: r.steps ?? [],
      estimated_calories: r.estimated_calories ?? null,
      tags: r.tags ?? [],
      source: "ai",
      createdAt: serverTimestamp(),
    });

    saved.push({
      id: docRef.id,
      ...r,
      source: "ai",
      // createdAt will be the server timestamp; if you need it,
      // you can re-read the docs, but for dashboard display this
      // is usually not critical.
      createdAt: undefined,
    });
  }

  return saved;
}

/**
 * Save a single recipe to the user's "saved/favorites" list.
 * This is what you'll call from the Recipe modal when they click "Save".
 *
 * Stored under: users/{uid}/savedRecipes
 */
export async function saveRecipeToFavoritesForCurrentUser(
  recipe: RecipeInput
): Promise<{ id: string }> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("You must be logged in to save recipes.");
  }

  const savedRef = collection(db, "users", user.uid, "savedRecipes");
  const docRef = await addDoc(savedRef, {
    title: recipe.title,
    description: recipe.description,
    ingredients: recipe.ingredients ?? [],
    steps: recipe.steps ?? [],
    estimated_calories: recipe.estimated_calories ?? null,
    tags: recipe.tags ?? [],
    source: recipe.source ?? "ai",
    createdAt: serverTimestamp(),
  });

  return { id: docRef.id };
}

/**
 * List the user's saved/favorited recipes.
 */
export async function listSavedRecipesForCurrentUser(): Promise<Recipe[]> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("You must be logged in to list saved recipes.");
  }

  const savedRef = collection(db, "users", user.uid, "savedRecipes");
  const q = query(savedRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  const recipes: Recipe[] = [];
  snap.forEach((docSnap) => {
    const data = docSnap.data() as any;
    recipes.push({
      id: docSnap.id,
      title: data.title,
      description: data.description ?? "",
      ingredients: data.ingredients ?? [],
      steps: data.steps ?? [],
      estimated_calories: data.estimated_calories ?? undefined,
      tags: data.tags ?? [],
      source: data.source ?? "ai",
      createdAt: data.createdAt,
    });
  });

  return recipes;
}

/**
 * Delete a saved recipe for the current user by document id.
 * (Deletes from users/{uid}/savedRecipes/{recipeId})
 */
export async function deleteSavedRecipeForCurrentUser(
  recipeId: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("You must be logged in to delete a saved recipe.");
  }

  const recipeRef = doc(db, "users", user.uid, "savedRecipes", recipeId);
  await deleteDoc(recipeRef);
}
