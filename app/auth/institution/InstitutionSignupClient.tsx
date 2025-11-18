"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";

import { auth } from "@/lib/firebase";
import { db, createUserProfile, type UserProfile } from "@/lib/firestore";
import { collection, addDoc } from "firebase/firestore";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function InstitutionSignupClient() {
  const router = useRouter();
  const [institutionName, setInstitutionName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
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
        adminName,
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

      // Simple client-side cookies for middleware
      try {
        document.cookie = `session=${encodeURIComponent(
          user.uid,
        )}; Path=/; Max-Age=${60 * 60 * 24 * 7}`;
        document.cookie = `role=institution; Path=/; Max-Age=${
          60 * 60 * 24 * 7
        }`;
      } catch {
        // ignore cookie errors
      }

      router.push("/institution/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Failed to sign up institution");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5 text-left">
      <div className="space-y-2">
        <Label htmlFor="institutionName" className="text-zinc-200">
          Institution name
        </Label>
        <Input
          id="institutionName"
          value={institutionName}
          onChange={(e) => setInstitutionName(e.target.value)}
          placeholder="Springfield High"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="adminName" className="text-zinc-200">
          Admin name
        </Label>
        <Input
          id="adminName"
          value={adminName}
          onChange={(e) => setAdminName(e.target.value)}
          placeholder="Dana Scully"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-zinc-200">
          Email
        </Label>
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
        <Label htmlFor="password" className="text-zinc-200">
          Password
        </Label>
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
        className="w-full bg-white text-zinc-900 font-semibold hover:bg-zinc-100"
        disabled={loading}
      >
        {loading ? "Creating account…" : "Create institution account"}
      </Button>
    </form>
  );
}
