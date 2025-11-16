import { auth } from "./firebase";
import { db, createUserProfile, type UserProfile } from "./firestore";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  UserCredential,
} from "firebase/auth";

export async function signUpWithEmail(email: string, password: string): Promise<UserCredential> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  // After sign up, create a users/{uid} document with default role/tier
  try {
    const user = cred.user;
    const profile: UserProfile = {
      uid: user.uid,
      email: user.email ?? "",
      role: "user",
      subscriptionTier: "free",
      institutionId: null,
      createdAt: Date.now(),
    } as UserProfile;
    await createUserProfile(profile);

    // Set session + role cookies for middleware
    const maxAge = 60 * 60 * 24 * 30; // 30 days
    if (typeof document !== "undefined") {
      document.cookie = `session=${user.uid}; path=/; max-age=${maxAge}`;
      document.cookie = `role=user; path=/; max-age=${maxAge}`;
    }
  } catch (e) {
    // Non-fatal: account exists; profile creation can be retried later
    // eslint-disable-next-line no-console
    console.error("Failed to create user profile doc", e);
  }
  return cred;
}

export async function signInWithEmail(email: string, password: string): Promise<UserCredential> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  try {
    const uid = cred.user.uid;
    // Fetch role to seed cookie for middleware checks
    let role = "user" as string;
    try {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) {
        const data = snap.data() as any;
        if (data?.role) role = String(data.role);
      }
    } catch {
      // ignore
    }
    const maxAge = 60 * 60 * 24 * 30; // 30 days
    if (typeof document !== "undefined") {
      document.cookie = `session=${uid}; path=/; max-age=${maxAge}`;
      document.cookie = `role=${encodeURIComponent(role)}; path=/; max-age=${maxAge}`;
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Failed to set auth cookies", e);
  }
  return cred;
}
