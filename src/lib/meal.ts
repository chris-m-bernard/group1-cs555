import { auth, db } from "./firebase";
import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  updateDoc,
  getDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

// --- AI-related types ---

export type AIDetection = {
  bbox: number[];
  food: string;
  confidence: number;
  all_predictions: [string, number][];
  crop_type: string;
};

export type AIPerItem = {
  food: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

export type MealInput = {
  title: string;
  imageData: string; // base64 or data URL
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  description?: string;
  aiSource?: string;
  aiDetections?: any[];
  aiPerItem?: any[];
};

export type Meal = {
  id: string;
  title: string;
  imageData?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  description?: string;
  createdAt?: any;
  aiSource?: string;
  aiDetections?: any[];
  aiPerItem?: any[];
};

/**
 * Create a meal for the current user.
 * Accepts already-processed data (image URL + macros + AI info).
 * Defaults missing macro values to 0 and description to empty string.
 */
export async function addMealForCurrentUser(input: MealInput) {
  const user = auth.currentUser;
  if (!user) throw new Error("User must be logged in to upload meals");

  const {
    title,
    imageData,
    calories = 0,
    protein = 0,
    carbs = 0,
    fat = 0,
    description = "",
    aiSource = "manual",
    aiDetections = [],
    aiPerItem = [],
  } = input;

  const docRef = await addDoc(collection(db, "users", user.uid, "meals"), {
    title,
    imageData,
    calories,
    protein,
    carbs,
    fat,
    description,
    aiSource,
    aiDetections,
    aiPerItem,
    createdAt: serverTimestamp(),
  });

  return { id: docRef.id };
}

/**
 * Delete a meal for the current user by id.
 */
export const deleteMeal = async (mealId: string) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("You must be logged in to delete a meal.");
  }

  const mealRef = doc(db, "users", user.uid, "meals", mealId);
  await deleteDoc(mealRef);
};

/**
 * Update a meal for the current user by id.
 */
export const updateMeal = async (
  mealId: string,
  updates: Partial<
    Pick<
      Meal,
      | "title"
      | "calories"
      | "protein"
      | "carbs"
      | "fat"
      | "description"
      | "createdAt"
      | "aiSource"
      | "aiDetections"
      | "aiPerItem"
    >
  >
) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("You must be logged in to update a meal.");
  }

  const mealRef = doc(db, "users", user.uid, "meals", mealId);
  await updateDoc(mealRef, updates);
};

/**
 * Get a single meal for the current user by id.
 */
export const getMealForCurrentUser = async (
  mealId: string
): Promise<Meal | null> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("You must be logged in to fetch a meal.");
  }

  const mealRef = doc(db, "users", user.uid, "meals", mealId);
  const snap = await getDoc(mealRef);
  if (!snap.exists()) return null;

  const data = snap.data() as any;

  return {
    id: snap.id,
    title: data.title,
    imageData: data.imageData,
    calories: Number(data.calories ?? 0),
    protein: Number(data.protein ?? 0),
    carbs: Number(data.carbs ?? 0),
    fat: Number(data.fat ?? 0),
    description: data.description ?? "",
    createdAt: data.createdAt,
    aiSource: data.aiSource ?? undefined,
    aiDetections: data.aiDetections ?? [],
    aiPerItem: data.aiPerItem ?? [],
  };
};

/**
 * List ALL meals for the current user.
 * Macros default to 0 if missing.
 */
export const listMealsForCurrentUser = async (): Promise<Meal[]> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("You must be logged in to list meals.");
  }

  const mealsRef = collection(db, "users", user.uid, "meals");
  const q = query(mealsRef);
  const snap = await getDocs(q);

  const meals: Meal[] = [];
  snap.forEach((docSnap) => {
    const data = docSnap.data() as any;
    meals.push({
      id: docSnap.id,
      title: data.title,
      imageData: data.imageData,
      calories: Number(data.calories ?? 0),
      protein: Number(data.protein ?? 0),
      carbs: Number(data.carbs ?? 0),
      fat: Number(data.fat ?? 0),
      description: data.description ?? "",
      createdAt: data.createdAt,
      aiSource: data.aiSource ?? undefined,
      aiDetections: data.aiDetections ?? [],
      aiPerItem: data.aiPerItem ?? [],
    });
  });

  return meals;
};

/**
 * Get meals for the current user in the last N days.
 * Used by the Analytics page for weekly summaries, etc.
 */
export const getMealsForCurrentUserLastNDays = async (
  days: number
): Promise<Meal[]> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("You must be logged in to list meals.");
  }

  const now = new Date();
  const start = new Date();
  start.setDate(now.getDate() - days + 1);

  const mealsRef = collection(db, "users", user.uid, "meals");

  const q = query(
    mealsRef,
    where("createdAt", ">=", Timestamp.fromDate(start))
  );

  const snap = await getDocs(q);

  const meals: Meal[] = [];
  snap.forEach((docSnap) => {
    const data = docSnap.data() as any;
    meals.push({
      id: docSnap.id,
      title: data.title,
      imageData: data.imageData,
      calories: Number(data.calories ?? 0),
      protein: Number(data.protein ?? 0),
      carbs: Number(data.carbs ?? 0),
      fat: Number(data.fat ?? 0),
      description: data.description ?? "",
      createdAt: data.createdAt,
      aiSource: data.aiSource ?? undefined,
      aiDetections: data.aiDetections ?? [],
      aiPerItem: data.aiPerItem ?? [],
    });
  });

  return meals;
};
