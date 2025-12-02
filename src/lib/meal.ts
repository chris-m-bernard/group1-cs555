import { auth, db } from "./firebase";
import {
  collection,
  doc,
  addDoc,
  deleteDoc,
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
  createdAt?: any;
};

export async function addMealForCurrentUser(file: File, title: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("User must be logged in to upload meals");

  // Convert to base64 instead of uploading to Storage
  const imageData = await fileToBase64(file);

  const docRef = await addDoc(collection(db, "users", user.uid, "meals"), {
    title,
    imageData, // store the base64 string here
    createdAt: serverTimestamp(),
  });

  return { id: docRef.id };
}

export const deleteMeal = async (mealId: string) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("You must be logged in to delete a meal.");
  }

  const mealRef = doc(db, "users", user.uid, "meals", mealId);
  await deleteDoc(mealRef);
};
