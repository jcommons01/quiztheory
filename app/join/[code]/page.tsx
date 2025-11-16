"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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
        try { sessionStorage.setItem("pending-join-code", code); } catch {}
        router.push(`/auth?join=${encodeURIComponent(code)}`);
        return;
      }

      try {
        setStatus("Joining class…");
        await joinClassByCode(user.uid, code);
        setStatus("Joined! Redirecting…");
        router.push("/dashboard#classes");
      } catch (e: any) {
        // If already a member or code invalid, show a friendly message then bounce to dashboard
        console.error("Join failed", e);
        setStatus(e?.message || "Could not join class");
        setTimeout(() => router.push("/dashboard#classes"), 1200);
      }
    };
    run();
  }, [code, router]);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center px-6">
      <div className="text-sm text-zinc-300">{status}</div>
    </main>
  );
}
