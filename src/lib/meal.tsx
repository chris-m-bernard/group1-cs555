// src/lib/meals.ts
import { auth, db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export type MealInput = {
  title: string;
  imageUrl?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
};

export async function addMealForCurrentUser(input: MealInput) {
  const user = auth.currentUser;
  if (!user) throw new Error("No logged-in user");

  const mealsCol = collection(db, "users", user.uid, "meals");

  const docRef = await addDoc(mealsCol, {
    ...input,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}
