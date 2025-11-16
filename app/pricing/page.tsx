"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Pricing – QuizTheory",
  description: "Free and Pro plans for AI-powered quiz generation. Start free and upgrade when ready.",
};

export default function PricingPage() {
  const router = useRouter();
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const startCheckout = async (priceKey: string) => {
    setLoadingKey(priceKey);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceKey }),
      });
      const json = await res.json();
      if (json.url) {
        // Use router for client navigation (works for external URLs too)
        router.push(json.url);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="max-w-5xl mx-auto py-20 px-6 md:px-10">
        <div className="text-center mb-14 space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Pricing</h1>
          <p className="text-zinc-400 max-w-2xl mx-auto text-sm md:text-base">Simple plans while we finish Stripe integration. Start learning faster today.</p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          <PlanCard
            name="Free"
            price="£0"
            blurb="Get started at no cost"
            features={[
              "Generate up to 3 quizzes",
              "Upload text, PDFs & photos",
              "Basic AI speed",
            ]}
            ctaLabel="Get Started"
            href="/auth"
            highlight={false}
          />
          <PlanCard
            name="Pro"
            price="£19"
            blurb="For power learners & teams"
            features={[
              "Unlimited quizzes",
              "Faster AI responses",
              "Share public quiz links",
              "Coming soon: class management",
            ]}
            ctaLabel={loadingKey === "pro" ? "Redirecting…" : "Upgrade"}
            onClick={() => startCheckout("pro")}
            loading={loadingKey === "pro"}
            highlight
          />
          <PlanCard
            name="Teacher"
            price="£39"
            blurb="For educators and tutors"
            features={[
              "Unlimited quizzes",
              "Priority AI performance",
              "Classroom sharing",
              "Advanced results & analytics",
            ]}
            ctaLabel={loadingKey === "teacher" ? "Redirecting…" : "Upgrade"}
            onClick={() => startCheckout("teacher")}
            loading={loadingKey === "teacher"}
          />
          <PlanCard
            name="Institution"
            price="Custom"
            blurb="For schools and teams"
            features={[
              "All Teacher features",
              "Bulk onboarding",
              "Advanced admin controls",
              "Priority support",
            ]}
            ctaLabel={loadingKey === "institution_small" ? "Redirecting…" : "Contact / Upgrade"}
            onClick={() => startCheckout("institution_small")}
            loading={loadingKey === "institution_small"}
          />
        </div>
      </div>
    </main>
  );
}

function PlanCard({
  name,
  price,
  blurb,
  features,
  ctaLabel,
  href,
  onClick,
  loading,
  highlight,
}: {
  name: string;
  price: string;
  blurb: string;
  features: string[];
  ctaLabel: string;
  href?: string;
  onClick?: () => void;
  loading?: boolean;
  highlight?: boolean;
}) {
  return (
    <Card className={`relative overflow-hidden rounded-3xl border ${highlight ? "border-violet-600/50 bg-zinc-900/50" : "border-zinc-800 bg-zinc-900/40"} backdrop-blur-sm flex flex-col`}>
      {highlight && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-72 h-72 rounded-full bg-linear-to-tr from-violet-600/30 to-fuchsia-500/20 blur-3xl" />
        </div>
      )}
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl font-semibold tracking-tight flex items-baseline gap-3">
          {name}
          <span className="text-lg font-medium text-zinc-400">{price}<span className="text-xs ml-1 font-normal text-zinc-500">/mo</span></span>
        </CardTitle>
        <div className="text-sm text-zinc-400">{blurb}</div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <ul className="space-y-2 mb-6 text-sm text-zinc-300">
          {features.map(f => (
            <li key={f} className="flex gap-2">
              <span className="text-violet-400">•</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
        {onClick ? (
          <Button
            size="lg"
            className={`mt-auto font-semibold ${highlight ? "bg-violet-600 hover:bg-violet-500 text-white" : ""}`}
            variant={highlight ? undefined : "outline"}
            onClick={onClick}
            disabled={!!loading}
          >
            {ctaLabel}
          </Button>
        ) : (
          <Button asChild size="lg" className={`mt-auto font-semibold ${highlight ? "bg-violet-600 hover:bg-violet-500 text-white" : ""}`} variant={highlight ? undefined : "outline"}>
            <Link href={href ?? "/auth"}>{ctaLabel}</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
