import type { Metadata } from "next";
import AppShell, { PageContainer } from "@/components/layout/app-shell";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How QuizTheory stores and uses your data during beta.",
};

// Server Component (no "use client")
export default function PrivacyPage() {
  return (
    <AppShell>
      <PageContainer>
        {/* Hero header – aligned with new app style */}
        <section className="relative pt-2 pb-8 lg:pt-0 text-center w-full">
          <div aria-hidden className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-28 left-1/2 -translate-x-1/2 size-96 rounded-full bg-linear-to-br from-violet-600/30 via-fuchsia-500/10 to-transparent blur-3xl opacity-40" />
          </div>
          <h1 className="relative z-10 text-2xl font-semibold leading-tight sm:text-3xl md:text-4xl lg:text-5xl bg-clip-text text-transparent bg-linear-to-r from-zinc-100 via-zinc-200 to-zinc-400">
            Privacy Policy
          </h1>
          <p className="relative z-10 mt-4 text-sm text-slate-400 md:text-base">
            Last updated: {new Date().getFullYear()}
          </p>
        </section>

        {/* Content */}
        <div className="mx-auto w-full max-w-2xl pb-24 space-y-6">
          <Card className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl font-medium">
                What Data We Store
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-300 md:text-base leading-relaxed">
              We currently store the email address you sign up with, the quizzes
              you create, and the results generated when you or others take
              those quizzes. We also keep basic timestamps and counts needed to
              operate the service.
            </CardContent>
          </Card>

          <Card className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl font-medium">
                How We Use Your Data
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-300 md:text-base leading-relaxed">
              Your data is used solely to provide and improve the QuizTheory
              experience: generating quizzes, saving and retrieving them,
              showing your results, and enabling upcoming class / assignment
              features. We do not sell your information. If we ever consider
              broader usage (like aggregated analytics), it will be anonymized
              and documented here first.
            </CardContent>
          </Card>

          <Card className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl font-medium">
                Beta Status &amp; Changes
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-300 md:text-base leading-relaxed">
              QuizTheory is currently in beta. Features, storage locations, and
              retention periods may evolve quickly as we iterate. Significant
              privacy-impacting changes will be reflected on this page. If a
              change is material, we will provide a notice in-app.
            </CardContent>
          </Card>

          <Card className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl font-medium">
                Your Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-300 md:text-base leading-relaxed">
              You can delete quizzes you no longer want to keep. If you need
              your account and associated data removed entirely, please reach
              out via support and we will handle it as soon as possible while in
              beta.
            </CardContent>
          </Card>

          <footer className="pt-2 text-xs text-zinc-500">
            This document is an early placeholder and not a finalized legal
            agreement.
          </footer>
        </div>
      </PageContainer>
    </AppShell>
  );
}
