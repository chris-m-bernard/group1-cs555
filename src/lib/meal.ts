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
import { fileToBase64 } from "./fileToBase64";

export type MealInput = {
  title: string;
  file: File;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  description?: string;
};

export type Meal = {
  id: string;
  title: string;
  imageData?: string; // base64 image stored in Firestore
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  description?: string;
  createdAt?: any; // Firestore Timestamp or Date; keep flexible for now
};

/**
 * Create a meal for the current user.
 * Defaults all macro values to 0 and description to empty string.
 */
export async function addMealForCurrentUser(file: File, title: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("User must be logged in to upload meals");

  // Convert to base64 instead of uploading to Storage
  const imageData = await fileToBase64(file);

  const docRef = await addDoc(collection(db, "users", user.uid, "meals"), {
    title,
    imageData,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    description: "",
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
// src/lib/meal.ts
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
      | "createdAt" // ⬅️ add this
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
 * (Optional helper if you want to use it in MealDetail instead of inlining getDoc.)
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
  };
};

/**
 * List ALL meals for the current user.
 * Macros are defaulted to 0 if missing.
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

  // If some older meals don't have createdAt yet, they simply won't show up here,
  // which is fine for "recent analytics" use.
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
    });
  });

  return meals;
};
