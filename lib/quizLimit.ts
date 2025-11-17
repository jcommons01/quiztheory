import { NextResponse } from "next/server";
import { getUserProfile } from "@/lib/firestore";

export async function checkQuizLimit(userId: string) {
  const userDoc = await getUserProfile(userId);
  if (!userDoc) {
    return { allowed: false, error: "User not found" };
  }
  const isPro = userDoc.subscriptionTier === "pro" || userDoc.subscriptionTier === "teacher" || userDoc.subscriptionTier === "institution";
  if (!isPro) {
    if ((userDoc.freeQuizCountThisMonth ?? 0) >= 3) {
      return {
        allowed: false,
        error: "Free plan limit reached. Please upgrade to generate more quizzes.",
      };
    }
  }
  return { allowed: true };
}
