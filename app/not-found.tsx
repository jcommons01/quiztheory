import Link from "next/link";
import { Button } from "@/components/ui/button";
import AppShell, { PageContainer } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

// Global 404 page for the App Router
export default function NotFound() {
  return (
    <AppShell>
      <PageContainer>
        {/* Hero header */}
        <section className="pt-2 lg:pt-0">
          <div className="mx-auto max-w-6xl text-center">
            <h1 className="text-2xl font-semibold leading-tight sm:text-3xl md:text-4xl lg:text-5xl bg-clip-text text-transparent bg-linear-to-r from-zinc-100 via-zinc-200 to-zinc-400">
              Page not found
            </h1>
            <p className="mt-4 text-sm text-slate-400 md:text-base">
              This quiz or page doesn&apos;t exist anymore, or the link may be incorrect.
            </p>
          </div>
        </section>

        {/* Main content card */}
        <div className="mx-auto max-w-md w-full pt-10 pb-24">
          <Card className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg sm:text-xl">Let&apos;s get you back on track</CardTitle>
              <CardDescription className="text-sm text-slate-400">
                Choose where you&apos;d like to go next.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-6 px-4 sm:px-8 text-center space-y-6">
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild>
                  <Link href="/dashboard">Go to dashboard</Link>
                </Button>
                <Button variant="secondary" asChild>
                  <Link href="/">Back to home</Link>
                </Button>
              </div>
              <p className="text-[11px] text-zinc-500">
                QuizTheory • Empowering learning through adaptive quizzes.
              </p>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
