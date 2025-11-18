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

          {/* MOCKUP / EXPLAINER */}
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
                  Preview the QuizTheory interface.
                </CardDescription>
              </CardHeader>

              <CardContent className="relative">
                <p className="mb-6 max-w-2xl text-sm leading-relaxed text-slate-300 md:text-base">
                  Generate quizzes from dense technical material, compliance
                  manuals, language notes, or onboarding guides. This is a
                  preview of the interface that turns raw content into smart
                  assessments.
                </p>
                <div className="rounded-xl border border-white/10 bg-zinc-900/80 shadow-lg">
                  {/* Placeholder mock interface block */}
                  <div className="h-48 rounded-xl bg-zinc-900" />
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
