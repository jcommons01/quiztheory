"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

import AppShell, { PageContainer } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { auth } from "@/lib/firebase";
import { joinClassByCode } from "@/lib/firestore";

export default function JoinByCodePage() {
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const code = (params?.code || "").toString().toUpperCase();

  const [status, setStatus] = useState<string>("Preparing…");

  useEffect(() => {
    const run = async () => {
      if (!code) {
        router.push("/dashboard");
        return;
      }

      const user = auth.currentUser;
      if (!user) {
        // Store code and hand off to auth
        try {
          sessionStorage.setItem("pending-join-code", code);
        } catch {
          // ignore
        }
        router.push(`/auth?join=${encodeURIComponent(code)}`);
        return;
      }

      try {
        setStatus("Joining class…");
        await joinClassByCode(user.uid, code);
        setStatus("Joined! Redirecting…");
        router.push("/dashboard#classes");
      } catch (e: any) {
        console.error("Join failed", e);
        setStatus(e?.message || "Could not join class");
        setTimeout(() => router.push("/dashboard#classes"), 1200);
      }
    };

    run();
  }, [code, router]);

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-10 lg:space-y-12">
          {/* Hero header */}
          <section className="pt-2 lg:pt-0 text-center">
            <div className="mx-auto w-full max-w-4xl">
              <h1 className="text-2xl font-semibold leading-tight sm:text-3xl md:text-4xl lg:text-5xl">
                Joining class
              </h1>
              <p className="mt-4 text-sm text-slate-400 md:text-base">
                Processing your join code and adding you to the class group.
              </p>
            </div>
          </section>

          {/* Status card */}
          <div className="mx-auto w-full max-w-md">
            <Card className="w-full rounded-3xl border border-white/5 bg-card/70 backdrop-blur shadow-lg">
              <CardContent className="flex min-h-[120px] items-center justify-center px-4 py-8 sm:px-8">
                <div className="text-sm text-zinc-300">{status}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}
