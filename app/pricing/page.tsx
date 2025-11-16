import Link from "next/link";

export const metadata = {
  title: "Pricing – QuizTheory",
  description: "Free and Pro plans for AI-powered quiz generation. Start free and upgrade when ready.",
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Hero */}
      <section className="relative px-4 pt-16 pb-8 text-center">
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-28 left-1/2 -translate-x-1/2 size-168 rounded-full bg-linear-to-br from-violet-600/30 via-fuchsia-500/10 to-transparent blur-3xl opacity-40" />
        </div>
        <h1 className="relative z-10 text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-zinc-100 via-zinc-200 to-zinc-400">Pricing</h1>
        <p className="relative z-10 mt-3 text-zinc-300 text-sm md:text-base max-w-2xl mx-auto">
          Simple, transparent plans while we finish subscriptions. Start free and upgrade when ready.
        </p>
      </section>

      {/* Plans */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Free */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm p-6 flex flex-col">
            <div className="flex items-baseline justify-between">
              <h2 className="text-2xl font-semibold tracking-tight">Free</h2>
              <div className="text-lg text-zinc-400">£0<span className="text-xs ml-1 text-zinc-500">/mo</span></div>
            </div>
            <p className="mt-1 text-sm text-zinc-400">Everything you need to try QuizTheory.</p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-300">
              <li className="flex gap-2"><span className="text-violet-400">•</span><span>Generate up to 3 quizzes</span></li>
              <li className="flex gap-2"><span className="text-violet-400">•</span><span>Text to quiz</span></li>
              <li className="flex gap-2"><span className="text-violet-400">•</span><span>Share public quiz links</span></li>
            </ul>
            <div className="mt-6">
              <Link href="/auth" className="inline-flex items-center justify-center h-10 rounded-md px-5 text-sm font-medium border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 transition">
                Start free
              </Link>
            </div>
          </div>

          {/* Pro */}
          <div className="relative rounded-2xl border border-violet-600/40 bg-zinc-900/50 backdrop-blur-sm p-6 flex flex-col overflow-hidden">
            <div aria-hidden className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-24 -right-24 size-72 rounded-full bg-linear-to-tr from-violet-600/30 to-fuchsia-500/20 blur-3xl" />
            </div>
            <div className="flex items-baseline justify-between relative z-10">
              <h2 className="text-2xl font-semibold tracking-tight">Pro</h2>
              <div className="text-lg text-zinc-300">£19<span className="text-xs ml-1 text-zinc-500">/mo</span></div>
            </div>
            <p className="mt-1 text-sm text-zinc-300 relative z-10">For power learners. Subscriptions are coming soon.</p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-200 relative z-10">
              <li className="flex gap-2"><span className="text-violet-300">•</span><span>Unlimited quizzes</span></li>
              <li className="flex gap-2"><span className="text-violet-300">•</span><span>PDF & image to quiz</span></li>
              <li className="flex gap-2"><span className="text-violet-300">•</span><span>Faster generation</span></li>
            </ul>
            <div className="mt-6 relative z-10">
              <Link href="/auth" className="inline-flex items-center justify-center h-10 rounded-md px-5 text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition">
                Join waitlist
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
