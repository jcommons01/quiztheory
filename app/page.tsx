import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "QuizTheory – AI Quiz Generation",
  description: "Turn any text, PDF, or image into a quiz. AI-powered quiz generation for students, teachers, and training organisations.",
};

// Homepage marketing / landing page (dark theme)
export default function Home() {
  return (
    <main className="bg-zinc-950 text-zinc-50 flex flex-col items-stretch min-h-screen">
      {/* Hero */}
      <section className="relative flex flex-col justify-center items-center gap-8 text-center px-6 md:px-12 pb-32 pt-40 min-h-screen">
        {/* Decorative gradient */}
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 size-168 rounded-full bg-linear-to-br from-violet-600/30 via-fuchsia-500/10 to-transparent blur-3xl opacity-40" />
        </div>
  <h1 className="relative z-10 font-bold tracking-tight text-4xl md:text-6xl max-w-5xl leading-[1.05] bg-clip-text text-transparent bg-linear-to-r from-zinc-100 via-zinc-200 to-zinc-400">
          Turn any text, PDF, or image into a quiz.
        </h1>
        <p className="relative z-10 max-w-2xl text-lg md:text-2xl text-zinc-300 leading-relaxed">
          AI-powered quiz generation for students, teachers, and training organisations.
        </p>
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-4 mt-2">
          <Button asChild size="lg" className="font-semibold">
            <Link href="/auth">Get Started Free</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="font-semibold text-white hover:text-white border-white/70 hover:bg-white/10"
          >
            <Link href="/p/demo">Try a Live Demo</Link>
          </Button>
        </div>
      </section>

      {/* Why QuizTheory */}
      <section className="px-6 md:px-12 mb-24">
        <div className="mx-auto max-w-6xl rounded-3xl border border-zinc-800 p-10 md:p-16 bg-zinc-900/40 backdrop-blur-sm">
          <h2 className="text-2xl md:text-4xl font-semibold tracking-tight mb-12">Why QuizTheory?</h2>
          <div className="grid gap-8 md:gap-10 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard title="Instant AI Quiz Generation" description="Paste text or provide source material and get structured questions in seconds." />
            <FeatureCard title="Upload Notes, PDFs & Photos" description="Bring your study notes, PDFs, or textbook snapshots—QuizTheory extracts key concepts." />
            <FeatureCard title="Share Quizzes with One Click" description="Distribute a quiz link to a class, team, or cohort instantly." />
          </div>
        </div>
      </section>

      {/* Who uses */}
      <section className="px-6 md:px-12 mb-24">
        <div className="mx-auto max-w-6xl rounded-3xl border border-zinc-800 p-10 md:p-16 bg-zinc-900/30">
          <h2 className="text-2xl md:text-4xl font-semibold tracking-tight mb-10">Who uses QuizTheory?</h2>
          <ul className="flex flex-wrap gap-4 md:gap-6">
            {[
              "Students",
              "Tutors",
              "Colleges",
              "Apprenticeship Centres",
              "Businesses & Training Teams",
            ].map((aud) => (
              <li
                key={aud}
                className="px-5 py-2 rounded-full bg-zinc-900/60 border border-zinc-800 text-sm md:text-base font-medium text-zinc-300 hover:text-zinc-100 hover:border-zinc-700 transition-colors"
              >
                {aud}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Mockup Section */}
      <section className="px-6 md:px-12 mb-24">
  <div className="mx-auto max-w-6xl rounded-3xl border border-zinc-800 p-10 md:p-16 bg-linear-to-br from-zinc-900 via-zinc-900 to-zinc-800 relative overflow-hidden">
          <div aria-hidden className="absolute -top-24 -right-32 w-96 h-96 rounded-full bg-linear-to-l from-violet-700/30 to-fuchsia-500/20 blur-3xl" />
          <div aria-hidden className="absolute -bottom-32 -left-16 w-72 h-72 rounded-full bg-linear-to-tr from-indigo-600/30 to-purple-500/30 blur-3xl" />
          <h2 className="relative text-2xl md:text-4xl font-semibold tracking-tight mb-8">See it in action</h2>
          <p className="relative max-w-2xl text-zinc-300 mb-8 leading-relaxed">
            Generate quizzes from dense technical material, compliance manuals, language notes, or onboarding guides. This is a preview of the interface that transforms raw content into smart assessments.
          </p>
          <div className="relative rounded-lg border border-zinc-700/70 bg-zinc-800/80 backdrop-blur-sm shadow-lg">
            <div className="h-64 bg-zinc-800 rounded-lg" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 md:px-12 mb-32">
        <div className="mx-auto max-w-5xl rounded-3xl border border-zinc-800 p-10 md:p-16 bg-zinc-900/50 text-center">
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-6">Ready to make smarter quizzes?</h2>
          <p className="max-w-xl mx-auto text-zinc-300 mb-10 leading-relaxed">
            Start free—create your first AI-generated quiz in under a minute.
          </p>
          <Button asChild size="lg" className="font-semibold">
            <Link href="/auth">Create your first quiz</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="group relative rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 md:p-8 transition-colors hover:border-zinc-700">
      <h3 className="text-lg md:text-xl font-semibold mb-3 text-zinc-100 tracking-tight">
        {title}
      </h3>
      <p className="text-sm md:text-base leading-relaxed text-zinc-400">
        {description}
      </p>
    </div>
  );
}
