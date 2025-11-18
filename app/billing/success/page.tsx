import { Suspense } from "react";
import BillingSuccessClient from "./BillingSuccessClient";
import AppShell, { PageContainer } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";

export default function BillingSuccessPage() {
  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-8 lg:space-y-12">
          {/* HERO */}
          <section className="pt-2 lg:pt-0">
            <div className="mx-auto w-full max-w-3xl text-center">
              <h1 className="text-2xl font-semibold leading-tight sm:text-3xl md:text-4xl lg:text-5xl">
                Payment Successful
              </h1>
              <p className="mt-4 text-sm text-slate-400 md:text-base">
                Your payment has been processed successfully.  
                Thank you for upgrading your QuizTheory plan!
              </p>
            </div>
          </section>

          {/* CARD */}
          <section className="mx-auto w-full max-w-md">
            <Card className="w-full rounded-3xl border border-white/5 bg-card/80 shadow-lg backdrop-blur">
              <CardContent className="px-4 py-6 sm:px-6">
                <Suspense
                  fallback={
                    <div className="flex min-h-[200px] items-center justify-center text-sm text-zinc-400">
                      Loading…
                    </div>
                  }
                >
                  <BillingSuccessClient />
                </Suspense>
              </CardContent>
            </Card>
          </section>
        </div>
      </PageContainer>
    </AppShell>
  );
}
