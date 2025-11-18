import Link from "next/link";
import AppShell, { PageContainer } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export const metadata = {
  title: "QuizTheory – AI Quiz Generation",
  description:
    "Turn any text, PDF, or image into a quiz. AI-powered quiz generation for students, teachers, and training organisations.",
};

// Marketing / landing homepage – aligned with new dashboard layout
export default function Home() {
  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-12 lg:space-y-16">
          {/* HERO */}
          <section className="relative mx-auto w-full max-w-3xl text-center pt-4">
            {/* Soft background glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10"
            >
              <div className="absolute left-1/2 top-[-7rem] h-80 w-80 -translate-x-1/2 rounded-full bg-gradient-to-br from-violet-600/30 via-fuchsia-500/10 to-transparent blur-3xl" />
            </div>

            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">
              Turn any text, PDF, or image
              <span className="block text-slate-50/90">into a quiz.</span>
            </h1>

            <p className="mt-4 text-sm leading-relaxed text-slate-400 md:text-base">
              AI-powered quiz generation for students, teachers, and training
              organisations.
            </p>

            <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                asChild
                size="lg"
                className="w-full min-h-12 font-semibold sm:w-auto"
              >
                <Link href="/auth">Get started free</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full min-h-12 border-white/60 font-semibold text-white hover:bg-white/10 hover:text-white sm:w-auto"
              >
                <Link href="/p/demo">Try a live demo</Link>
              </Button>
            </div>
          </section>

          {/* WHY QUIZTHEORY */}
          <section className="mx-auto w-full max-w-4xl">
            <Card className="rounded-3xl border border-white/5 bg-card/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="mb-2 text-xl font-semibold tracking-tight md:text-2xl">
                  Why QuizTheory?
                </CardTitle>
                <CardDescription className="mb-4 text-sm text-slate-400 md:text-base">
                  What makes QuizTheory different?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                  <FeatureCard
                    title="Instant AI quiz generation"
                    description="Paste text or provide source material and get structured questions in seconds."
                  />
                  <FeatureCard
                    title="Upload notes, PDFs & photos"
                    description="Bring your study notes, PDFs, or textbook snapshots—QuizTheory extracts key concepts."
                  />
                  <FeatureCard
                    title="Share with one click"
                    description="Distribute a quiz link to a class, team, or cohort instantly."
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* WHO USES */}
          <section className="mx-auto w-full max-w-4xl">
            <Card className="rounded-3xl border border-white/5 bg-card/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="mb-2 text-xl font-semibold tracking-tight md:text-2xl">
                  Who uses QuizTheory?
                </CardTitle>
                <CardDescription className="mb-4 text-sm text-slate-400 md:text-base">
                  Our platform is trusted by:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-wrap gap-2 md:gap-3">
                  {[
                    "Students",
                    "Tutors",
                    "Colleges",
                    "Apprenticeship centres",
                    "Businesses & training teams",
                  ].map((aud) => (
                    <li
                      key={aud}
                      className="rounded-full border border-white/10 bg-zinc-900/60 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-white/20 hover:text-zinc-50 md:text-base"
                    >
                      {aud}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* SEE IT IN ACTION – REALISTIC EDITOR + QUIZ UI */}
          <section className="mx-auto w-full max-w-4xl">
            <Card className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-900/90">
              {/* subtle glows */}
              <div
                aria-hidden
                className="pointer-events-none absolute -right-32 -top-24 h-72 w-72 rounded-full bg-gradient-to-l from-violet-700/30 to-fuchsia-500/20 blur-3xl"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-32 -left-16 h-56 w-56 rounded-full bg-gradient-to-tr from-indigo-600/25 to-purple-500/25 blur-3xl"
              />

              <CardHeader className="relative">
                <CardTitle className="mb-2 text-xl font-semibold tracking-tight md:text-2xl">
                  See it in action
                </CardTitle>
                <CardDescription className="mb-4 text-sm text-slate-400 md:text-base">
                  Preview how QuizTheory turns raw content into a polished quiz.
                </CardDescription>
              </CardHeader>

              <CardContent className="relative">
                <p className="mb-6 max-w-2xl text-sm leading-relaxed text-slate-300 md:text-base">
                  Paste notes on the left, review and edit the AI-generated
                  questions, then play through the quiz on the right. What you
                  see here matches the real editor and quiz player in the app.
                </p>

                <div className="grid gap-6 lg:grid-cols-2">
                  {/* LEFT: EDITOR PREVIEW (matches /quiz/create styling) */}
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 sm:p-5 shadow-lg">
                    <div className="mb-4 flex items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-zinc-100">
                          Quiz Preview
                        </div>
                        <div className="text-xs text-zinc-500">
                          Review and edit questions before saving.
                        </div>
                      </div>
                      <div className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/30">
                        AI ready
                      </div>
                    </div>

                    {/* Title field */}
                    <div className="mb-4 space-y-1">
                      <div className="text-xs font-medium text-zinc-400">
                        Quiz title
                      </div>
                      <div className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200">
                        Natural Gas Basics
                      </div>
                    </div>

                    {/* Question card (matches your /quiz/create layout in miniature) */}
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3 sm:p-4 space-y-4">
                      <div className="text-xs font-semibold text-zinc-300">
                        Question 1
                      </div>

                      {/* Question text */}
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-zinc-400">
                          Question text
                        </div>
                        <div className="min-h-[56px] rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200">
                          What is the primary component of natural gas?
                        </div>
                      </div>

                      {/* Options with radio buttons */}
                      <div className="space-y-2">
                        <div className="text-xs text-zinc-400">
                          Options (mark the correct one)
                        </div>
                        {["Propane", "Methane", "Butane", "Ethane"].map(
                          (opt, idx) => (
                            <div
                              key={opt}
                              className="flex items-center gap-3 text-xs"
                            >
                              <span
                                className={[
                                  "inline-flex size-4 items-center justify-center rounded-full border",
                                  opt === "Methane"
                                    ? "border-emerald-500 bg-emerald-500"
                                    : "border-zinc-600 bg-zinc-900",
                                ].join(" ")}
                              >
                                {opt === "Methane" && (
                                  <span className="size-1.5 rounded-full bg-zinc-950" />
                                )}
                              </span>
                              <div className="flex-1 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-zinc-200">
                                {opt}
                              </div>
                            </div>
                          )
                        )}
                      </div>

                      {/* Explanation field */}
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-zinc-400">
                          Explanation
                        </div>
                        <div className="min-h-[52px] rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-[11px] leading-relaxed text-zinc-300">
                          Natural gas is primarily composed of methane, which is
                          a simple hydrocarbon.
                        </div>
                        <p className="text-[10px] text-zinc-500">
                          Shown to learners after they answer.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        className="h-8 px-4 text-xs font-medium"
                      >
                        Save quiz
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-4 text-xs font-medium"
                      >
                        Regenerate with AI
                      </Button>
                    </div>
                  </div>

                  {/* RIGHT: QUIZ PLAYER PREVIEW (matches /quiz/[id]) */}
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 sm:p-5 shadow-lg">
                    <div className="mb-4 flex items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-zinc-100">
                          Quiz player
                        </div>
                        <div className="text-xs text-zinc-500">
                          What learners see when they take your quiz.
                        </div>
                      </div>
                      <div className="rounded-full bg-zinc-900 px-3 py-1 text-xs text-zinc-400 border border-zinc-800">
                        Question 1 / 10
                      </div>
                    </div>

                    <div className="mx-auto max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-5 space-y-4">
                      <div className="text-sm font-medium text-zinc-50 text-center">
                        What is the primary component of natural gas?
                      </div>

                      <div className="space-y-2">
                        {/* Correct selected option */}
                        <button className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white">
                          Methane
                        </button>
                        {/* Other options (disabled / grey like real UI) */}
                        <button className="w-full rounded-md bg-zinc-800 px-4 py-2 text-sm text-zinc-200">
                          Ethane
                        </button>
                        <button className="w-full rounded-md bg-zinc-800 px-4 py-2 text-sm text-zinc-200">
                          Propane
                        </button>
                        <button className="w-full rounded-md bg-zinc-800 px-4 py-2 text-sm text-zinc-200">
                          Butane
                        </button>
                      </div>

                      <div className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-3 text-xs leading-relaxed text-zinc-300">
                        <span className="font-semibold text-emerald-400">
                          Explanation:
                        </span>{" "}
                        Natural gas is primarily composed of methane, which is a
                        simple hydrocarbon.
                      </div>

                      <div className="flex justify-end">
                        <button className="rounded-md bg-zinc-100 px-4 py-1.5 text-xs font-medium text-zinc-900 hover:bg-white">
                          Next
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-500">
                      <span>Scores saved to your dashboard.</span>
                      <span>No extra setup needed.</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* FINAL CTA */}
          <section className="mx-auto w-full max-w-3xl pb-4">
            <Card className="rounded-3xl border border-white/5 bg-card/80 text-center backdrop-blur">
              <CardHeader>
                <CardTitle className="mb-2 text-2xl font-semibold tracking-tight md:text-3xl">
                  Ready to make smarter quizzes?
                </CardTitle>
                <CardDescription className="mb-4 text-sm text-slate-400 md:text-base">
                  Start free—create your first AI-generated quiz in under a
                  minute.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  asChild
                  size="lg"
                  className="w-full font-semibold sm:w-auto"
                >
                  <Link href="/auth">Create your first quiz</Link>
                </Button>
              </CardContent>
            </Card>
          </section>
        </div>
      </PageContainer>
    </AppShell>
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
    <div className="group rounded-2xl border border-white/5 bg-zinc-950/70 p-5 transition-colors hover:border-white/15 md:p-6">
      <h3 className="mb-2 text-base font-semibold tracking-tight text-zinc-50 md:text-lg">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-zinc-400 md:text-[15px]">
        {description}
      </p>
    </div>
  );
}
