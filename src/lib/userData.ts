// src/lib/userData.ts
import { auth, db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export async function ensureUserDoc() {
  const user = auth.currentUser;
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      name: user.displayName ?? "", // you can update later from settings
      createdAt: new Date(),
    });
  }
}
