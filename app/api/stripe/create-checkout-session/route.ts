import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { db } from "@/lib/firestore";
import { doc, getDoc, setDoc } from "firebase/firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null) as { priceId?: string } | null;
    const priceId = body?.priceId;
    if (!priceId || typeof priceId !== "string") {
      return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
    }

    // Auth via session cookie (uid expected)
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value || null;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const uid = sessionCookie;

    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
      return NextResponse.json({ error: "Stripe secret not configured" }, { status: 500 });
    }

    // Get or create Stripe customer and persist to users/{uid}
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    let customerId: string | null = null;
    let email: string | undefined = undefined;
    if (userSnap.exists()) {
      const data = userSnap.data() as any;
      customerId = data?.stripeCustomerId || null;
      email = data?.email;
    }

    if (!customerId) {
      const params = new URLSearchParams();
      if (email) params.append("email", email);
      params.append("metadata[uid]", uid);
      const resp = await fetch("https://api.stripe.com/v1/customers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      });
      if (!resp.ok) {
        const err = await resp.text();
        return NextResponse.json({ error: `Stripe customer error: ${err}` }, { status: 500 });
      }
      const customerJson = (await resp.json()) as any;
      customerId = customerJson.id as string;
      await setDoc(userRef, { stripeCustomerId: customerId }, { merge: true });
    }

    const hdrs = await headers();
    const origin = hdrs.get("origin") || new URL(req.url).origin;

    const sParams = new URLSearchParams();
    sParams.append("mode", "subscription");
    sParams.append("customer", customerId!);
    sParams.append("line_items[0][price]", priceId);
    sParams.append("line_items[0][quantity]", "1");
  sParams.append("success_url", `${origin}/dashboard?upgrade=success`);
  sParams.append("cancel_url", `${origin}/pricing?canceled=1`);
    const sResp = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: sParams,
    });
    if (!sResp.ok) {
      const err = await sResp.text();
      return NextResponse.json({ error: `Stripe session error: ${err}` }, { status: 500 });
    }
    const sessionJson = (await sResp.json()) as any;
    return NextResponse.json({ url: sessionJson.url });
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error("create-checkout-session error", e);
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
