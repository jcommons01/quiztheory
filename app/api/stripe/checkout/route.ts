import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/stripe/checkout
// Body: { priceKey: "pro" | "teacher" | "institution_small" | "institution_large" }
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as { priceKey?: string } | null;
    const priceKey = body?.priceKey;
    if (!priceKey) {
      return NextResponse.json({ error: "Missing priceKey" }, { status: 400 });
    }

    const priceIdMap: Record<string, string | undefined> = {
      pro: process.env.STRIPE_PRICE_PRO,
      teacher: process.env.STRIPE_PRICE_TEACHER,
      institution_small: process.env.STRIPE_PRICE_INSTITUTION_SMALL,
      institution_large: process.env.STRIPE_PRICE_INSTITUTION_LARGE,
    };

    const priceId = priceIdMap[priceKey];
    if (!priceId) {
      return NextResponse.json({ error: "Invalid or unconfigured priceKey" }, { status: 400 });
    }

    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/pricing?canceled=1`,
      metadata: { priceKey },
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error("Stripe checkout session error", e);
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
