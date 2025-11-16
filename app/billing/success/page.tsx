"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function BillingSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const sessionId = searchParams.get("session_id");
      if (!sessionId) {
        setError(true);
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/stripe/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json?.success) {
          router.push("/dashboard");
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-50 px-4">
      <div className="max-w-md text-center">
        {error ? (
          <>
            <h1 className="text-2xl font-semibold">Something went wrong</h1>
            <p className="mt-2 text-zinc-400 text-sm">Please contact support.</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold">Finalising your upgrade…</h1>
            {loading && <p className="mt-2 text-zinc-400 text-sm">This will only take a moment.</p>}
          </>
        )}
      </div>
    </main>
  );
}
