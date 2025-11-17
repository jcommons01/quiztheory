import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }
    const userSnap = await adminDb.collection("users").doc(userId).get();
    const user = userSnap.exists ? userSnap.data() : null;
    if (!user || !user.stripeCustomerId) {
      return NextResponse.json({ error: "No Stripe customer" }, { status: 400 });
    }
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appUrl}/account`,
    });
    return NextResponse.json({ url: portalSession.url }, { status: 200 });
  } catch (err: any) {
    console.error("Stripe portal error", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
