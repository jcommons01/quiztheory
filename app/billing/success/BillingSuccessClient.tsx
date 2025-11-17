"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const BillingSuccessPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    // Webhook already updates Firestore; this page is just a nice handoff.
    const timer = setTimeout(() => {
      router.push("/dashboard");
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-50 px-4">
      <div className="max-w-md w-full rounded-2xl border border-zinc-800 bg-zinc-900/70 px-6 py-8 text-center shadow-lg">
        <h1 className="text-xl font-semibold mb-2">Thanks for upgrading 🎉</h1>
        <p className="text-sm text-zinc-300 mb-2">
          Your QuizTheory Pro subscription is now active.
        </p>
        <p className="text-[11px] text-zinc-500 mb-4">
          {sessionId
            ? "We’ve confirmed your payment and are redirecting you to your dashboard…"
            : "Redirecting you to your dashboard…"}
        </p>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="inline-flex items-center justify-center rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-700 transition"
        >
          Go to dashboard now
        </button>
      </div>
    </main>
  );
};

export default BillingSuccessPage;
