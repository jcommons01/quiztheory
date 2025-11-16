"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, createUserProfile, type UserProfile } from "@/lib/firestore";
import { collection, addDoc } from "firebase/firestore";

export default function InstitutionSignupPage() {
  const router = useRouter();
  const [institutionName, setInstitutionName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Create auth user
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      // Create institution document
      const instRef = await addDoc(collection(db, "institutions"), {
        name: institutionName,
        adminId: user.uid,
        createdAt: Date.now(),
      });

      // Create user profile for the admin
      const profile: UserProfile = {
        uid: user.uid,
        email,
        role: "institution",
        subscriptionTier: "institution",
        institutionId: instRef.id,
        createdAt: Date.now(),
      };
      await createUserProfile(profile);

      // Set simple cookies used by middleware for protected routes (non-HTTPOnly in client)
      try {
        document.cookie = `session=${encodeURIComponent(user.uid)}; Path=/; Max-Age=${60 * 60 * 24 * 7}`; // 7 days
        document.cookie = `role=institution; Path=/; Max-Age=${60 * 60 * 24 * 7}`;
      } catch {}

      router.push("/institution/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Failed to sign up institution");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-zinc-950 text-zinc-50 flex flex-col items-stretch min-h-screen">
      {/* Hero (matches /auth style) */}
      <section className="relative flex flex-col justify-center items-center gap-8 text-center px-6 md:px-12 pb-24 pt-40 min-h-screen">
        {/* Decorative gradient */}
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 size-168 rounded-full bg-linear-to-br from-violet-600/30 via-fuchsia-500/10 to-transparent blur-3xl opacity-40" />
        </div>

        <h1 className="relative z-10 font-bold tracking-tight text-4xl md:text-6xl max-w-5xl leading-[1.05] bg-clip-text text-transparent bg-linear-to-r from-zinc-100 via-zinc-200 to-zinc-400">
          Create Institution Account
        </h1>
        <p className="relative z-10 max-w-2xl text-lg md:text-2xl text-zinc-300 leading-relaxed">
          Sign up your school or organization.
        </p>

        {/* Form card */}
        <div className="relative z-10 w-full max-w-lg">
          <Card className="bg-zinc-900/70 border border-zinc-800 backdrop-blur-sm">
            <CardContent className="pt-6 pb-6">
              <form onSubmit={onSubmit} className="space-y-5 text-left">
                <div className="space-y-2">
                  <Label htmlFor="institutionName" className="text-zinc-200">Institution name</Label>
                  <Input
                    id="institutionName"
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    placeholder="Springfield High"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminName" className="text-zinc-200">Admin name</Label>
                  <Input
                    id="adminName"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="Dana Scully"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-200">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@school.edu"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-zinc-200">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-400" role="alert">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-violet-600 hover:bg-violet-500"
                  disabled={loading}
                >
                  {loading ? "Creating account…" : "Create institution account"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

