import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "QuizTheory beta Terms of Use placeholder.",
};

// Server Component (no "use client")
export default function TermsPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="max-w-3xl mx-auto py-10 px-4 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Terms of Use</h1>
          <p className="text-sm text-zinc-400">Last updated: {new Date().getFullYear()}</p>
        </header>

        <section className="space-y-2">
          <h2 className="text-xl font-medium">Beta Status</h2>
          <p className="text-sm leading-relaxed text-zinc-300">
            QuizTheory is in beta and provided "as is" without warranties. Features, data handling, and retention policies may change rapidly. Material changes will be noted here.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-medium">Acceptable Use</h2>
          <ul className="space-y-2 text-sm text-zinc-300 list-disc pl-5">
            <li>Do not upload or generate quizzes from illegal, abusive, or infringing content.</li>
            <li>Use the service for educational or study purposes only during beta.</li>
            <li>Do not attempt to reverse engineer, overload, or disrupt the platform.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-medium">Account & Data</h2>
          <p className="text-sm leading-relaxed text-zinc-300">
            You may request deletion of your account and stored data at any time by emailing us. While in beta we aim to respond promptly. Some backups or logs may persist briefly for security and operations before full purge.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-medium">Changes</h2>
          <p className="text-sm leading-relaxed text-zinc-300">
            We may refine or expand these Terms as the product stabilizes. Continued use after updates constitutes acceptance of the revised Terms. Check back periodically.
          </p>
        </section>

        <footer className="pt-4 text-xs text-zinc-500 space-y-1">
          <p>These Terms are an early placeholder and not a finalized legal agreement.</p>
          <p>See also our <Link href="/privacy" className="underline hover:text-zinc-300">Privacy Policy</Link>.</p>
        </footer>
      </div>
    </main>
  );
}
