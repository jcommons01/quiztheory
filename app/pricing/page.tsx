import Link from "next/link";
import AppShell, { PageContainer } from "@/components/layout/app-shell";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export const metadata = {
  title: "Pricing – QuizTheory",
  description:
    "Free and Pro plans for AI-powered quiz generation. Start free and upgrade when ready.",
};

export default function PricingPage() {
  return (
    <AppShell>
      <PageContainer>
        {/* Hero */}
        <section className="relative pt-2 pb-8 lg:pt-0 text-center w-full">
          <div aria-hidden className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-28 left-1/2 -translate-x-1/2 size-96 rounded-full bg-linear-to-br from-violet-600/30 via-fuchsia-500/10 to-transparent blur-3xl opacity-40" />
          </div>
          <h1 className="relative z-10 text-2xl font-semibold leading-tight sm:text-3xl md:text-4xl lg:text-5xl bg-clip-text text-transparent bg-linear-to-r from-zinc-100 via-zinc-200 to-zinc-400">
            Pricing
          </h1>
          <p className="relative z-10 mt-4 text-sm text-slate-400 md:text-base max-w-xl mx-auto">
            Simple, transparent plans while we finish subscriptions. Start free
            and upgrade when ready.
          </p>
        </section>

        {/* Plans */}
        <section className="relative z-10 w-full pb-16">
          <div className="mx-auto max-w-4xl grid gap-6 md:grid-cols-2">
            {/* Free */}
            <Card className="rounded-2xl border border-white/5 bg-card/70 backdrop-blur-sm flex flex-col">
              <CardHeader className="flex flex-row items-baseline justify-between pb-2">
                <div>
                  <CardTitle className="text-xl font-semibold tracking-tight">
                    Free
                  </CardTitle>
                  <div className="mt-1 inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900/60 px-2 py-0.5 text-[11px] uppercase tracking-wide text-zinc-400">
                    Current
                  </div>
                </div>
                <span className="text-base text-zinc-200">
                  £0
                  <span className="text-xs ml-1 text-zinc-500">/mo</span>
                </span>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="mt-1 text-sm text-slate-400 md:text-base">
                  Everything you need to try QuizTheory.
                </CardDescription>
                <ul className="mt-4 space-y-2 text-sm text-zinc-300">
                  <li className="flex gap-2">
                    <span className="mt-[2px] text-violet-400">•</span>
                    <span>Generate up to 3 quizzes</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-[2px] text-violet-400">•</span>
                    <span>Text to quiz</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-[2px] text-violet-400">•</span>
                    <span>Share public quiz links</span>
                  </li>
                </ul>
                <div className="mt-6">
                  <Link
                    href="/auth"
                    className="inline-flex items-center justify-center h-10 rounded-full px-5 text-sm font-medium border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 transition w-full"
                  >
                    Start free
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Pro */}
            <Card className="relative rounded-2xl border border-violet-600/40 bg-card/80 backdrop-blur-sm flex flex-col overflow-hidden">
              <div aria-hidden className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-24 -right-24 size-72 rounded-full bg-linear-to-tr from-violet-600/30 to-fuchsia-500/20 blur-3xl" />
              </div>
              <CardHeader className="flex flex-row items-baseline justify-between pb-2 relative z-10">
                <div>
                  <CardTitle className="text-xl font-semibold tracking-tight">
                    Pro
                  </CardTitle>
                  <div className="mt-1 inline-flex items-center rounded-full border border-violet-600/50 bg-violet-600/10 px-2 py-0.5 text-[11px] uppercase tracking-wide text-violet-200">
                    Coming soon
                  </div>
                </div>
                <span className="text-base text-zinc-100">
                  £19
                  <span className="text-xs ml-1 text-zinc-500">/mo</span>
                </span>
              </CardHeader>
              <CardContent className="pt-0 relative z-10">
                <CardDescription className="mt-1 text-sm text-slate-400 md:text-base">
                  For power learners. Subscriptions are coming soon.
                </CardDescription>
                <ul className="mt-4 space-y-2 text-sm text-zinc-100">
                  <li className="flex gap-2">
                    <span className="mt-[2px] text-violet-300">•</span>
                    <span>Unlimited quizzes</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-[2px] text-violet-300">•</span>
                    <span>PDF &amp; image to quiz</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-[2px] text-violet-300">•</span>
                    <span>Faster generation</span>
                  </li>
                </ul>
                <div className="mt-6">
                  <Link
                    href="/auth"
                    className="inline-flex items-center justify-center h-10 rounded-full px-5 text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition w-full"
                  >
                    Join waitlist
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </PageContainer>
    </AppShell>
  );
}
