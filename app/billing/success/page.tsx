
import { Suspense } from "react";
import BillingSuccessClient from "./BillingSuccessClient";

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-400 text-sm">
        Loading…
      </div>
    }>
      <BillingSuccessClient />
    </Suspense>
  );
}
