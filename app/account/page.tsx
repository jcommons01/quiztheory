"use client";

import { useEffect, useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { UserProfile, createUserProfile } from "@/lib/firestore";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";

import AppShell, { PageContainer } from "@/components/layout/app-shell";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [resetStatus, setResetStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [resetError, setResetError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  // Get the current user from Firebase Auth (client-side only)
  const user = typeof window !== "undefined" ? auth.currentUser : null;

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

  // Auth + profile listener
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

  const planMap = {
    free: "Free",
    pro: "Pro",
    teacher: "Teacher",
    institution: "Institution",
  } as const;

  const currentTier = profile?.subscriptionTier ?? "free";
  const isProOrAbove =
    currentTier === "pro" ||
    currentTier === "teacher" ||
    currentTier === "institution";

  /* ------------------------------------------------------------------ */
  /*  Loading / error states                                            */
  /* ------------------------------------------------------------------ */

  if (loading) {
    return (
      <AppShell>
        <PageContainer>
          <div className="flex h-[60vh] items-center justify-center text-sm text-zinc-400">
            Loading your account…
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell>
        <PageContainer>
          <div className="flex h-[60vh] items-center justify-center text-sm text-red-400">
            Could not load your account.
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Main render                                                       */
  /* ------------------------------------------------------------------ */

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-8 lg:space-y-12">
          {/* HERO */}
          <section className="pt-2 lg:pt-0">
            <div className="mx-auto w-full max-w-3xl text-center">
              <h1 className="text-2xl font-semibold leading-tight sm:text-3xl md:text-4xl lg:text-5xl">
                Account
              </h1>
              <p className="mt-4 text-sm text-slate-400 md:text-base">
                Manage your QuizTheory account, plan, and security settings.
              </p>
            </div>
          </section>

          {/* ACCOUNT CARD */}
          <section className="mx-auto w-full max-w-xl">
            <Card className="w-full rounded-3xl border border-white/5 bg-card/80 shadow-lg backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">
                  Account details
                </CardTitle>
                <CardDescription className="text-sm text-zinc-400">
                  Your QuizTheory profile and subscription information.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 py-4">
                {/* Email */}
                <div>
                  <div className="mb-1 text-xs text-zinc-500">Email</div>
                  <div className="text-base font-medium text-zinc-100">
                    {profile.email}
                  </div>
                </div>

                {/* Plan */}
                <div>
                  <div className="mb-1 text-xs text-zinc-500">Plan</div>
                  <div className="text-base font-medium text-zinc-100">
                    {planMap[currentTier as keyof typeof planMap] || "Free"}
                  </div>
                  {isProOrAbove && profile.subscribedAt && (
                    <div className="mt-1 text-xs text-zinc-400">
                      Since:{" "}
                      {new Date(profile.subscribedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Created date */}
                {profile.createdAt && (
                  <div>
                    <div className="mb-1 text-xs text-zinc-500">Created</div>
                    <div className="text-base text-zinc-100">
                      {new Date(profile.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                )}

                {/* Subscription controls */}
                {isProOrAbove && (
                  <div className="border-t border-white/5 pt-4">
                    <div className="mb-2 text-xs text-zinc-500">
                      Subscription
                    </div>
                    <div className="mb-2 text-sm text-zinc-300">
                      You are on QuizTheory{" "}
                      {
                        planMap[
                          currentTier as keyof typeof planMap
                        ]
                      }{" "}
                      – billed monthly via Stripe.
                    </div>
                    <Button
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={handleManageSubscription}
                      disabled={portalLoading}
                    >
                      {portalLoading
                        ? "Opening portal…"
                        : "Manage subscription"}
                    </Button>
                    {portalError && (
                      <div className="mt-2 text-xs text-red-400">
                        {portalError}
                      </div>
                    )}
                    <div className="mt-2 text-xs text-zinc-400">
                      You can cancel, update your payment method, or change
                      your subscription in the Stripe customer portal.
                    </div>
                  </div>
                )}

                {/* Password reset */}
                <div className="border-t border-white/5 pt-4">
                  <div className="mb-2 text-xs text-zinc-500">
                    Change password
                  </div>
                  <Button
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={handlePasswordReset}
                    disabled={!user || !user.email || sending}
                  >
                    {sending ? "Sending…" : "Send password reset email"}
                  </Button>
                  {resetStatus === "success" && (
                    <div className="mt-2 text-xs text-emerald-400">
                      Password reset email sent – check your inbox.
                    </div>
                  )}
                  {resetStatus === "error" && resetError && (
                    <div className="mt-2 text-xs text-red-400">
                      {resetError}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </PageContainer>
    </AppShell>
  );
}
