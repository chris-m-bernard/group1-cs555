// src/lib/goals.ts
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export type GoalType = "maintain" | "lose" | "gain";

export type UserGoals = {
  goalType: GoalType;
  dailyCalories: number; // store as numbers in Firestore
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
  notes: string;
  updatedAt?: Date;
};

const COLLECTION = "goals";

// Get the user's goals (one document per user)
export async function getUserGoals(userId: string): Promise<UserGoals | null> {
  const ref = doc(db, COLLECTION, userId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  const data = snap.data();

  return {
    goalType: data.goalType ?? "maintain",
    dailyCalories: Number(data.dailyCalories ?? 0),
    dailyProtein: Number(data.dailyProtein ?? 0),
    dailyCarbs: Number(data.dailyCarbs ?? 0),
    dailyFat: Number(data.dailyFat ?? 0),
    notes: data.notes ?? "",
    updatedAt: data.updatedAt?.toDate?.() ?? undefined,
  };
}

// Create or update the user's goals
export async function saveUserGoals(
  userId: string,
  goals: UserGoals
): Promise<void> {
  const ref = doc(db, COLLECTION, userId);

  await setDoc(
    ref,
    {
      ...goals,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// Delete the user's goals document
export async function deleteUserGoals(userId: string): Promise<void> {
  const ref = doc(db, COLLECTION, userId);
  await deleteDoc(ref);
}
