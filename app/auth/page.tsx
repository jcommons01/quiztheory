
import { Suspense } from "react";
import AuthPageClient from "./AuthPageClient";

export const metadata = {
  title: "Sign in – QuizTheory",
  description: "Sign in or create an account to generate and manage AI-powered quizzes.",
};

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-400 text-sm">
        Loading sign-in…
      </div>
    }>
      <AuthPageClient />
    </Suspense>
  );
}
