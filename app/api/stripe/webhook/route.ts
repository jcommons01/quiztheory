import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/firestore";
import { collection, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import crypto from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Map Stripe price IDs to your internal subscription tiers
// Configure via env for flexibility: STRIPE_PRICE_PRO, STRIPE_PRICE_TEAM
type Tier = "free" | "pro" | "team";
function mapPriceToTier(priceId?: string | null): Tier | null {
  if (!priceId) return null;
  const pro = process.env.STRIPE_PRICE_PRO;
  const team = process.env.STRIPE_PRICE_TEAM;
  if (team && priceId === team) return "team";
  if (pro && priceId === pro) return "pro";
  return null;
}

function timingSafeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function parseStripeSignature(sigHeader: string | null): { t: string; v1: string[] } | null {
  if (!sigHeader) return null;
  const parts = sigHeader.split(",");
  let t = "";
  const v1: string[] = [];
  for (const p of parts) {
    const [k, v] = p.split("=");
    if (k === "t") t = v;
    if (k === "v1") v1.push(v);
  }
  if (!t || !v1.length) return null;
  return { t, v1 };
}

function verifyStripeSignature(rawBody: string, sigHeader: string | null, secret: string, toleranceSec = 300) {
  const parsed = parseStripeSignature(sigHeader);
  if (!parsed) return false;
  const { t, v1 } = parsed;
  const expected = crypto.createHmac("sha256", secret).update(`${t}.${rawBody}`, "utf8").digest("hex");
  // timestamp tolerance
  const ts = Number(t);
  if (Number.isFinite(ts)) {
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - ts) > toleranceSec) {
      return false;
    }
  }
  return v1.some(sig => timingSafeEqual(sig, expected));
}

async function findUidByCustomerId(customerId: string): Promise<string | null> {
  const snap = await getDocs(query(collection(db, "users"), where("stripeCustomerId", "==", customerId)));
  if (snap.empty) return null;
  return snap.docs[0].id;
}

async function updateUser(uid: string, data: Record<string, any>) {
  await setDoc(doc(db, "users", uid), data, { merge: true });
}

// Helper to fetch a Stripe subscription via REST to extract priceId
async function fetchStripeSubscriptionPriceId(subscriptionId: string, secret: string): Promise<string | null> {
  if (!subscriptionId) return null;
  const resp = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${secret}` },
  });
  if (!resp.ok) return null;
  const json = (await resp.json()) as any;
  // pick first item price id
  const items = json?.items?.data as any[] | undefined;
  const priceId = items && items.length ? items[0]?.price?.id : null;
  return typeof priceId === "string" ? priceId : null;
}

export async function POST(req: Request) {
  try {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 500 });
    }
    const sigHeader = (await headers()).get("stripe-signature");
    const rawBuffer = await req.arrayBuffer();
    const rawBody = Buffer.from(rawBuffer).toString("utf8");

    // Verify signature
    const valid = verifyStripeSignature(rawBody, sigHeader, secret);
    if (!valid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const type = event?.type as string | undefined;
    const dataObject = event?.data?.object as any;

    if (!type || !dataObject) {
      return NextResponse.json({ ok: true });
    }

    if (type === "checkout.session.completed") {
      // Read userId from metadata (preferred), fallback to client_reference_id
      const customerId: string | undefined = dataObject?.customer ?? undefined;
      const subscriptionId: string | undefined = dataObject?.subscription ?? undefined;
      const metadata = dataObject?.metadata || {};
      const userId: string | undefined = metadata.userId || dataObject?.client_reference_id || undefined;

      if (!customerId || !userId) {
        return NextResponse.json({ ok: true });
      }

      // Log for debugging
      console.log("Webhook checkout.session.completed", {
        userId,
        subscriptionId,
        customerId,
      });

      // Prepare updates for Firestore user doc
      const updates: Record<string, any> = {
        isPro: true,
        subscriptionTier: "pro",
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        subscribedAt: Date.now(),
      };

      await updateUser(userId, updates);
      return NextResponse.json({ ok: true });
    }

    if (type === "customer.subscription.updated" || type === "customer.subscription.created") {
      const customerId: string | undefined = dataObject?.customer ?? undefined;
      if (!customerId) return NextResponse.json({ ok: true });

      // Extract price id from payload if available
      let priceId: string | null = null;
      const items = dataObject?.items?.data as any[] | undefined;
      if (items && items.length) {
        const first = items[0];
        priceId = first?.price?.id ?? null;
      }
      let tier: Tier | null = mapPriceToTier(priceId);

      // If not derivable, try refetching subscription (requires STRIPE_SECRET_KEY)
      if (!tier) {
        const secretKey = process.env.STRIPE_SECRET_KEY;
        const subscriptionId: string | undefined = dataObject?.id;
        if (secretKey && subscriptionId) {
          const fetchedPriceId = await fetchStripeSubscriptionPriceId(subscriptionId, secretKey);
          tier = mapPriceToTier(fetchedPriceId);
        }
      }

      const uid = await findUidByCustomerId(customerId);
      if (!uid) return NextResponse.json({ ok: true });

      const updates: Record<string, any> = { stripeCustomerId: customerId };
      if (tier) updates.subscriptionTier = tier;
      await updateUser(uid, updates);
      return NextResponse.json({ ok: true });
    }

    // Acknowledge other event types
    return NextResponse.json({ received: true });
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error("Stripe webhook error", e);
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
