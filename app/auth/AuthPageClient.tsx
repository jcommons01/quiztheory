"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signInWithEmail, signUpWithEmail } from "@/lib/auth";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { joinClassByCode } from "@/lib/firestore";

function humanizeFirebaseError(err: any): string {
  const msg: string = err?.message || "";
  const code: string = err?.code || "";

  if (code.includes("auth/user-not-found")) return "No account found with that email.";
  if (code.includes("auth/wrong-password")) return "Incorrect password.";
  if (code.includes("auth/invalid-credential")) return "Invalid email or password.";
  if (code.includes("auth/email-already-in-use")) return "Email is already in use.";
  if (code.includes("auth/weak-password")) return "Password should be at least 6 characters.";
  if (code.includes("auth/invalid-email")) return "Please enter a valid email address.";

  if (msg) {
    const m = msg.replace(/^Firebase:\s*/i, "").replace(/\(auth\/.+\)$/, "").trim();
    if (m) return m;
  }
  return "Something went wrong. Please try again.";
}

const AuthPageClient: React.FC = () => {
  const router = useRouter();
  const search = useSearchParams();

  const [tab, setTab] = useState<"login" | "signup">("login");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string>("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [signupError, setSignupError] = useState<string>("");
  const [signupLoading, setSignupLoading] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        const pending = (typeof window !== 'undefined') ? sessionStorage.getItem("pending-join-code") : null;
        if (pending) {
          void (async () => {
            try { await joinClassByCode(user.uid, pending); } catch (e) { /* ignore */ }
            try { sessionStorage.removeItem("pending-join-code"); } catch {}
            router.push("/dashboard#classes");
          })();
        } else {
          router.push("/dashboard");
        }
      }
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    const code = (search?.get("join") || "").toUpperCase();
    if (code) {
      try { sessionStorage.setItem("pending-join-code", code); } catch {}
    }
  }, [search]);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      await signInWithEmail(loginEmail.trim(), loginPassword);
      const pending = (typeof window !== 'undefined') ? sessionStorage.getItem("pending-join-code") : null;
      if (pending && auth.currentUser) {
        try { await joinClassByCode(auth.currentUser.uid, pending); } catch {}
        try { sessionStorage.removeItem("pending-join-code"); } catch {}
        router.push("/dashboard#classes");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setLoginError(humanizeFirebaseError(err));
    } finally {
      setLoginLoading(false);
    }
  };

  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");

    if (signupPassword !== signupConfirm) {
      setSignupError("Passwords do not match.");
      return;
    }

    setSignupLoading(true);
    try {
      await signUpWithEmail(signupEmail.trim(), signupPassword);
      const pending = (typeof window !== 'undefined') ? sessionStorage.getItem("pending-join-code") : null;
      if (pending && auth.currentUser) {
        try { await joinClassByCode(auth.currentUser.uid, pending); } catch {}
        try { sessionStorage.removeItem("pending-join-code"); } catch {}
        router.push("/dashboard#classes");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setSignupError(humanizeFirebaseError(err));
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <main className="bg-zinc-950 text-zinc-50 flex flex-col items-stretch min-h-screen">
      {/* Hero (matches homepage) */}
      <section className="relative flex flex-col justify-center items-center gap-8 text-center px-6 md:px-12 pb-24 pt-40 min-h-screen">
        {/* Decorative gradient (same as /) */}
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 size-168 rounded-full bg-linear-to-br from-violet-600/30 via-fuchsia-500/10 to-transparent blur-3xl opacity-40" />
        </div>
        <h1 className="relative z-10 font-bold tracking-tight text-4xl md:text-6xl max-w-5xl leading-[1.05] bg-clip-text text-transparent bg-linear-to-r from-zinc-100 via-zinc-200 to-zinc-400">
          Turn any text, PDF, or image into a quiz.
        </h1>
        <p className="relative z-10 max-w-2xl text-lg md:text-2xl text-zinc-300 leading-relaxed">
          AI-powered quiz generation for students, teachers, and training organisations.
        </p>

        {/* Auth Card */}
        <div className="relative z-10 w-full max-w-md">
          <Card className="bg-zinc-900/70 border border-zinc-800 backdrop-blur-sm">
            <CardContent className="pt-6 pb-6">
              <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
                <TabsList className="w-full">
                  <TabsTrigger value="login" className="flex-1">Login</TabsTrigger>
                  <TabsTrigger value="signup" className="flex-1">Sign up</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="mt-4">
                  <form onSubmit={onLogin} className="space-y-4">
                    <div className="space-y-2 text-left">
                      <Label htmlFor="login-email" className="text-zinc-200">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        placeholder="you@example.com"
                      />
                    </div>
                    <div className="space-y-2 text-left">
                      <Label htmlFor="login-password" className="text-zinc-200">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                      />
                    </div>
                    {loginError && (
                      <p className="text-sm text-red-500" role="alert">{loginError}</p>
                    )}
                    <Button type="submit" className="w-full" disabled={loginLoading}>
                      {loginLoading ? "Signing in…" : "Sign in"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="mt-4">
                  <form onSubmit={onSignup} className="space-y-4">
                    <div className="space-y-2 text-left">
                      <Label htmlFor="signup-email" className="text-zinc-200">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                        placeholder="you@example.com"
                      />
                    </div>
                    <div className="space-y-2 text-left">
                      <Label htmlFor="signup-password" className="text-zinc-200">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="space-y-2 text-left">
                      <Label htmlFor="signup-confirm" className="text-zinc-200">Confirm password</Label>
                      <Input
                        id="signup-confirm"
                        type="password"
                        value={signupConfirm}
                        onChange={(e) => setSignupConfirm(e.target.value)}
                        required
                        placeholder="••••••••"
                      />
                    </div>
                    {signupError && (
                      <p className="text-sm text-red-500" role="alert">{signupError}</p>
                    )}
                    <Button type="submit" className="w-full" disabled={signupLoading}>
                      {signupLoading ? "Creating account…" : "Create account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
              <div className="mt-5 flex flex-col items-center gap-1">
                <Button asChild variant="outline" size="sm">
                  <Link href="/auth/institution">Sign up as an institution</Link>
                </Button>
                <span className="text-[11px] text-zinc-500">For schools, colleges, and organisations</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
};

export default AuthPageClient;
