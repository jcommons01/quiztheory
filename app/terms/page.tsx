import type { Metadata } from "next";
import Link from "next/link";
import AppShell, { PageContainer } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "QuizTheory beta Terms of Use placeholder.",
};

// Server Component (no "use client")
export default function TermsPage() {
  return (
    <AppShell>
      <PageContainer>
        {/* Hero header */}
        <section className="pt-2 lg:pt-0">
          <div className="mx-auto max-w-6xl text-center">
            <h1 className="text-2xl font-semibold leading-tight sm:text-3xl md:text-4xl lg:text-5xl bg-clip-text text-transparent bg-linear-to-r from-zinc-100 via-zinc-200 to-zinc-400">
              Terms of Use
            </h1>
            <p className="mt-4 text-sm text-slate-400 md:text-base">
              Last updated: {new Date().getFullYear()}
            </p>
          </div>
        </section>

        {/* Main content */}
        <div className="mx-auto w-full max-w-2xl py-10 pb-24 space-y-8">
          <Card className="rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-medium">Beta Status</CardTitle>
              <CardDescription className="text-sm text-slate-400">
                QuizTheory is currently in beta and under active development.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-slate-300 md:text-base">
              QuizTheory is provided &quot;as is&quot; without warranties of any kind while in beta.
              Features, data handling, and retention policies may change quickly as we iterate.
              Material changes that affect how you use the product will be noted here or in-app.
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-medium">Acceptable Use</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-300 md:text-base">
              <ul className="space-y-2 list-disc pl-5">
                <li>
                  Do not upload or generate quizzes from illegal, abusive, infringing, or
                  discriminatory content.
                </li>
                <li>
                  Use the service primarily for educational, training, or study purposes during beta.
                </li>
                <li>
                  Do not attempt to reverse engineer, overload, attack, or otherwise disrupt the
                  platform or its infrastructure.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-medium">Account &amp; Data</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-300 md:text-base">
              You may request deletion of your account and stored data at any time by contacting us.
              While in beta we aim to respond promptly, but some backups or logs may persist briefly
              for security and operational reasons before being fully purged.
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-medium">Changes</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-300 md:text-base">
              We may refine or expand these Terms as the product stabilizes. If we make updates, we
              will revise this page and may provide an in-app notice for material changes. Your
              continued use of QuizTheory after changes go live constitutes acceptance of the
              revised Terms.
            </CardContent>
          </Card>

          <footer className="pt-2 text-xs text-zinc-500 space-y-1">
            <p>This document is an early placeholder and not a finalized legal agreement.</p>
            <p>
              See also our{" "}
              <Link
                href="/privacy"
                className="underline underline-offset-2 hover:text-zinc-300"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </footer>
        </div>
      </PageContainer>
    </AppShell>
  );
}
