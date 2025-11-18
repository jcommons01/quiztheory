import Link from "next/link";
import { Button } from "@/components/ui/button";
import TopNav from "@/components/marketing/top-nav";
import AppShell, { PageContainer } from "@/components/layout/app-shell";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

// Marketing landing page for QuizTheory (server component)
export default function LandingPage() {
  return (
    <AppShell>
      <PageContainer>
        <TopNav />

        {/* HERO */}
        <section className="relative isolate flex flex-col items-center justify-center text-center px-4 pt-16 pb-24 md:pb-32 w-full min-h-[60vh]">
          {/* Background glow */}
          <div className="absolute inset-0 -z-10 bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
          <div
            aria-hidden
            className="absolute top-0 left-1/2 -translate-x-1/2 size-160 rounded-full bg-linear-to-tr from-violet-600/20 via-fuchsia-500/10 to-transparent blur-3xl opacity-40"
          />

          <h1 className="max-w-4xl text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl lg:text-6xl bg-clip-text text-transparent bg-linear-to-r from-zinc-100 to-zinc-400">
            Turn any text, page, or photo into a quiz.
          </h1>

          <p className="mt-6 max-w-2xl text-sm md:text-base text-slate-400 leading-relaxed">
            QuizTheory helps students, teachers, and teams generate high-quality quizzes
            from notes, PDFs, and textbooks in seconds.
          </p>

          <div className="mt-10 flex flex-wrap justify-center items-center gap-4">
            <Button asChild size="lg" className="font-semibold">
              <Link href="/auth">Start free</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="font-semibold">
              <Link href="#demo">Watch demo</Link>
            </Button>
          </div>
        </section>

        {/* FEATURES */}
        <section className="py-16 w-full">
          <div className="mx-auto max-w-6xl grid gap-8 sm:grid-cols-3">
            {[
              {
                title: "Text → Quiz",
                desc: "Paste notes or summaries and instantly generate question sets.",
              },
              {
                title: "PDF & Image → Quiz",
                desc: "Upload PDFs or images; we extract and convert source material into quizzes.",
              },
              {
                title: "Classes & Results",
                desc: "Organize quizzes into classes and track performance & progress.",
              },
            ].map((f) => (
              <Card
                key={f.title}
                className="rounded-3xl border border-white/5 bg-card/70 backdrop-blur shadow-lg"
              >
                <CardHeader>
                  <CardTitle className="text-xl font-semibold tracking-tight text-zinc-100">
                    {f.title}
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed text-zinc-400">
                    {f.desc}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* AUDIENCE */}
        <section className="pb-20 w-full">
          <div className="mx-auto max-w-5xl text-center">
            <Card className="rounded-3xl border border-white/5 bg-card/70 backdrop-blur shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">
                  Who it’s for
                </CardTitle>
                <CardDescription className="text-sm md:text-base text-slate-400 mb-4">
                  QuizTheory is designed for a wide range of learners and educators.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-wrap justify-center gap-4 sm:gap-6 text-zinc-200 text-base sm:text-lg">
                  {["Students", "Teachers", "Colleges", "Teams"].map((label) => (
                    <li
                      key={label}
                      className="px-6 py-2 rounded-full bg-zinc-900/60 ring-1 ring-white/5 font-medium"
                    >
                      {label}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
      </PageContainer>
    </AppShell>
  );
}
