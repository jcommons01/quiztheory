"use client";

import { useEffect, useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { getUserProfile, UserProfile } from "@/lib/firestore";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import { createUserProfile } from "@/lib/firestore";
import AppShell from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetStatus, setResetStatus] = useState<"idle" | "success" | "error">("idle");
  const [resetError, setResetError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);
    const handleManageSubscription = async () => {
      setPortalError(null);
      setPortalLoading(true);
      try {
        if (!user || !user.uid) throw new Error("No user");
        const res = await fetch("/api/stripe/portal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.uid }),
        });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error(data.error || "No portal URL returned");
        }
      } catch (err: any) {
        setPortalError(err?.message || "Failed to open portal");
      } finally {
        setPortalLoading(false);
      }
    };
  // Get the current user from Firebase Auth
  const user = typeof window !== "undefined" ? auth.currentUser : null;
  const handlePasswordReset = async () => {
    setResetStatus("idle");
    setResetError(null);
    if (!user || !user.email) return;
    setSending(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setResetStatus("success");
    } catch (err: any) {
      setResetStatus("error");
      setResetError(err?.message || "Failed to send reset email");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user: any) => {
      if (!user) {
        router.replace("/auth");
        return;
      }
      // Listen to Firestore user doc in real-time
      const db = getFirestore();
      const userRef = doc(db, "users", user.uid);
      const unsubProfile = onSnapshot(userRef, async (snap) => {
        let prof = snap.exists() ? (snap.data() as UserProfile) : null;
        if (!prof) {
          // Create a default profile for legacy users
          prof = {
            uid: user.uid,
            email: user.email || "",
            role: "user",
            subscriptionTier: "free",
            createdAt: Date.now(),
          };
          await createUserProfile(prof);
        }
        setProfile(prof);
        setLoading(false);
      });
      // Clean up Firestore listener on unmount
      return unsubProfile;
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-[60vh] text-sm text-zinc-400">Loading your account…</div>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-[60vh] text-sm text-red-400">Could not load your account.</div>
      </AppShell>
    );
  }

  const planMap = {
    free: "Free",
    pro: "Pro",
    teacher: "Teacher",
    institution: "Institution",
  } as const;

  const currentTier = profile?.subscriptionTier ?? "free";
  const isProOrAbove = currentTier === "pro" || currentTier === "teacher" || currentTier === "institution";

  return (
    <AppShell>
      <div className="w-full max-w-md mx-auto px-4 py-10 flex flex-col items-center justify-center min-h-[60vh]">
        <Card className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Account</CardTitle>
            <CardDescription className="text-zinc-400">Your QuizTheory account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 py-4">
            <div>
              <div className="text-xs text-zinc-500 mb-1">Email</div>
              <div className="text-base font-medium text-zinc-100">{profile.email}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 mb-1">Plan</div>
              <div className="text-base font-medium text-zinc-100">{planMap[currentTier as keyof typeof planMap] || "Free"}</div>
              {isProOrAbove && profile.subscribedAt && (
                <div className="text-xs text-zinc-400 mt-1">Since: {new Date(profile.subscribedAt).toLocaleDateString()}</div>
              )}
            </div>
            {profile.createdAt && (
              <div>
                <div className="text-xs text-zinc-500 mb-1">Created</div>
                <div className="text-base text-zinc-100">{new Date(profile.createdAt).toLocaleDateString()}</div>
              </div>
            )}

            {/* Subscription section for Pro/Teacher/Institution */}
            {isProOrAbove && (
              <div className="pt-2 mb-4 border-t border-zinc-800">
                <div className="text-xs text-zinc-500 mb-2">Subscription</div>
                <div className="text-sm text-zinc-300 mb-2">
                  You are on QuizTheory {planMap[currentTier as keyof typeof planMap]} – billed monthly via Stripe.
                </div>
                <Button
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                >
                  {portalLoading ? "Opening portal…" : "Manage subscription"}
                </Button>
                {portalError && (
                  <div className="text-xs text-red-400 mt-2">{portalError}</div>
                )}
                <div className="text-xs text-zinc-400 mt-2">
                  You can cancel, update payment method, or change your subscription in the Stripe customer portal.
                </div>
              </div>
            )}

            {/* Change password section */}
            <div className="pt-2 mt-4 border-t border-zinc-800">
              <div className="text-xs text-zinc-500 mb-2">Change password</div>
              <Button
                size="sm"
                className="w-full sm:w-auto"
                onClick={handlePasswordReset}
                disabled={!user || !user.email || sending}
              >
                {sending ? "Sending..." : "Send password reset email"}
              </Button>
              {resetStatus === "success" && (
                <div className="text-xs text-green-400 mt-2">Password reset email sent – check your inbox</div>
              )}
              {resetStatus === "error" && resetError && (
                <div className="text-xs text-red-400 mt-2">{resetError}</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
