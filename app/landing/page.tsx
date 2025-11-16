import Link from "next/link";
import { Button } from "@/components/ui/button";
import TopNav from "@/components/marketing/top-nav";

// Marketing landing page for QuizTheory
// Server component (no "use client")
export default function LandingPage() {
  return (
    <main className="bg-zinc-950 text-zinc-50 flex flex-col min-h-screen">
      <TopNav />
      {/* Hero Section */}
      <section className="relative isolate flex flex-col items-center justify-center min-h-screen px-6 py-24 text-center overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-linear-to-br from-zinc-900 via-zinc-800 to-zinc-900" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 size-160 bg-linear-to-tr from-violet-600/20 via-fuchsia-500/10 to-transparent rounded-full blur-3xl opacity-50" aria-hidden />
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight max-w-4xl bg-clip-text text-transparent bg-linear-to-r from-zinc-100 to-zinc-400">
          Turn any text, page, or photo into a quiz.
        </h1>
        <p className="mt-6 max-w-2xl text-lg md:text-xl text-zinc-300 leading-relaxed">
          QuizTheory helps students, teachers, and teams generate high-quality quizzes from notes, PDFs, and textbooks in seconds.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button asChild size="lg" className="font-semibold">
            <Link href="/auth">Start free</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="font-semibold">
            <Link href="#demo">Watch demo</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 md:px-10 py-16 md:py-24 bg-zinc-950">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 sm:grid-cols-3">
            <Feature title="Text → Quiz" description="Paste notes or summaries and instantly generate question sets." />
            <Feature title="PDF & Image → Quiz" description="Upload PDFs or images of textbook pages; we extract and convert to quizzes." />
            <Feature title="Classes & Results" description="Organize quizzes into classes and track performance & progress." />
          </div>
        </div>
      </section>

      {/* Audience Section */}
      <section className="px-6 md:px-10 pb-24">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6">Who it&apos;s for</h2>
          <ul className="flex flex-wrap items-center justify-center gap-6 text-zinc-300 text-lg">
            {['Students', 'Teachers', 'Colleges', 'Teams'].map(label => (
              <li key={label} className="px-5 py-2 rounded-full bg-zinc-900/60 ring-1 ring-zinc-800 font-medium">
                {label}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}

function Feature({ title, description }: { title: string; description: string }) {
  return (
    <div className="group relative rounded-lg border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-sm transition-colors hover:border-zinc-700">
      <h3 className="text-xl font-semibold mb-3 text-zinc-100 tracking-tight">{title}</h3>
      <p className="text-sm leading-relaxed text-zinc-400">{description}</p>
    </div>
  );
}
