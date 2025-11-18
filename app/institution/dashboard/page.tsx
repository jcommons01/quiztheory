"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { db } from "@/lib/firestore";
import { doc, getDoc } from "firebase/firestore";
import AppShell, { PageContainer } from "@/components/layout/app-shell";
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
          const data = instSnap.data() as { name?: string } | undefined;

          setInstitutionName(data?.name || "Your Institution");
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
      <AppShell>
        <PageContainer>
          <div className="flex h-[60vh] items-center justify-center text-sm text-zinc-400">
            Loading…
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-10 lg:space-y-12">
          {/* Hero header */}
          <section className="text-center pt-2 lg:pt-0">
            <div className="mx-auto w-full max-w-4xl">
              <h1 className="text-2xl font-semibold sm:text-3xl md:text-4xl lg:text-5xl">
                Institution Dashboard
              </h1>
              <p className="mt-4 text-sm text-slate-400 md:text-base">
                Welcome to {institutionName}
              </p>
            </div>
          </section>

          {/* Main card */}
          <div className="mx-auto w-full max-w-3xl">
            <Card className="rounded-3xl border border-white/5 bg-card/70 backdrop-blur shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  What’s next
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6 text-zinc-300">
                <p className="leading-relaxed">
                  Coming soon: add teachers, manage classes, view analytics, and more powerful
                  tools for running your institution on QuizTheory.
                </p>

                <div className="flex flex-wrap gap-4 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => router.push("/dashboard")}
                    className="border-white/10 text-zinc-200 hover:bg-white/5"
                  >
                    Back to dashboard
                  </Button>

                  <Button
                    onClick={() => router.push("/pricing")}
                    className="bg-violet-600 hover:bg-violet-500"
                  >
                    Manage subscription
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}
