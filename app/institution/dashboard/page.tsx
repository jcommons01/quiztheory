"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { db } from "@/lib/firestore";
import { doc, getDoc } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function InstitutionDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [institutionName, setInstitutionName] = useState<string>("");

  useEffect(() => {
    const run = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.push("/auth/institution");
        return;
      }

      try {
        // Load user profile
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          router.push("/auth/institution");
          return;
        }
        const profile = userSnap.data() as {
          role?: string;
          institutionId?: string | null;
        };
        if (profile.role !== "institution") {
          router.push("/dashboard");
          return;
        }

        // Load institution document
        const instId = profile.institutionId;
        if (instId) {
          const instRef = doc(db, "institutions", instId);
          const instSnap = await getDoc(instRef);
          if (instSnap.exists()) {
            const data = instSnap.data() as { name?: string };
            setInstitutionName(data.name || "Your Institution");
          } else {
            setInstitutionName("Your Institution");
          }
        } else {
          setInstitutionName("Your Institution");
        }
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [router]);

  if (loading) {
    return (
  <main className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center px-4 w-full max-w-screen-sm mx-auto">
        <div className="text-sm text-zinc-400">Loading…</div>
      </main>
    );
  }

  return (
  <main className="bg-zinc-950 text-zinc-50 flex flex-col items-stretch min-h-screen px-4 w-full max-w-screen-sm mx-auto">
      {/* Hero to match app style */}
      <section className="relative flex flex-col justify-center items-center gap-4 text-center px-6 md:px-12 pt-28 pb-10">
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 size-168 rounded-full bg-linear-to-br from-violet-600/30 via-fuchsia-500/10 to-transparent blur-3xl opacity-40" />
        </div>
        <h1 className="relative z-10 font-bold tracking-tight text-3xl md:text-5xl leading-tight bg-clip-text text-transparent bg-linear-to-r from-zinc-100 via-zinc-200 to-zinc-400">
          Institution Dashboard
        </h1>
        <p className="relative z-10 max-w-2xl text-zinc-300 leading-relaxed text-sm md:text-base">
          Welcome to {institutionName}
        </p>
      </section>

      <div className="max-w-5xl mx-auto w-full px-6 md:px-10 pb-24">
        <Card className="border-zinc-800 bg-zinc-900/40">
          <CardHeader>
            <CardTitle className="text-xl">What’s next</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-zinc-300">
            <p>Coming soon: add teachers, manage classes, view analytics.</p>
            <div className="flex gap-3">
              <Button onClick={() => router.push("/dashboard")} variant="outline">
                Back to dashboard
              </Button>
              <Button onClick={() => router.push("/pricing")} className="bg-violet-600 hover:bg-violet-500">
                Manage subscription
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
