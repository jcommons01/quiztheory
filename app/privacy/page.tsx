import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How QuizTheory stores and uses your data during beta.",
};

// Server Component (no "use client")
export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 px-4 w-full max-w-screen-sm mx-auto">
      <div className="mx-auto py-8 space-y-8 w-full">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-zinc-400">Last updated: {new Date().getFullYear()}</p>
        </header>

        <section className="space-y-2">
          <h2 className="text-xl font-medium">What Data We Store</h2>
          <p className="text-sm leading-relaxed text-zinc-300">
            We currently store the email address you sign up with, the quizzes you create, and
            the results generated when you or others take those quizzes. We also keep basic
            timestamps and counts needed to operate the service.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-medium">How We Use Your Data</h2>
          <p className="text-sm leading-relaxed text-zinc-300">
            Your data is used solely to provide and improve the QuizTheory experience: generating
            quizzes, saving and retrieving them, showing your results, and enabling upcoming
            class / assignment features. We do not sell your information. If we ever consider
            broader usage (like aggregated analytics), it will be anonymized and documented here first.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-medium">Beta Status & Changes</h2>
          <p className="text-sm leading-relaxed text-zinc-300">
            QuizTheory is currently in beta. Features, storage locations, and retention periods
            may evolve quickly as we iterate. Significant privacy-impacting changes will be
            reflected on this page. If a change is material, we will provide a notice in-app.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-medium">Your Controls</h2>
          <p className="text-sm leading-relaxed text-zinc-300">
            You can delete quizzes you no longer want to keep. If you need your account and
            associated data removed entirely, please reach out via support and we will handle
            it as soon as possible while in beta.
          </p>
        </section>

        <footer className="pt-4 text-xs text-zinc-500">
          This document is an early placeholder and not a finalized legal agreement.
        </footer>
      </div>
    </main>
  );
}
