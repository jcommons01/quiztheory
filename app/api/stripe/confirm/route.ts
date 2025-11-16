import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import {
  getUserProfileByEmail,
  updateUserSubscriptionTier,
  SubscriptionTier,
} from "@/lib/firestore";

type ConfirmRequest = {
  sessionId: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<ConfirmRequest> | null;
    const sessionId = body?.sessionId;

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json(
        { error: "Missing sessionId" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Basic validations
    if (
      session.payment_status !== "paid" ||
      session.mode !== "subscription" ||
      !session.customer_email
    ) {
      console.error("Stripe confirm check failed", {
        payment_status: session.payment_status,
        mode: session.mode,
        customer_email: session.customer_email,
        sessionId,
      });
      return NextResponse.json({ success: false }, { status: 500 });
    }

    const priceKey = (session.metadata?.priceKey as string | undefined) ?? undefined;

    let tier: SubscriptionTier | undefined;
    switch (priceKey) {
      case "pro":
        tier = "pro";
        break;
      case "teacher":
        tier = "teacher";
        break;
      case "institution_small":
      case "institution_large":
        tier = "institution";
        break;
      default:
        console.error("Unknown or missing priceKey in session.metadata", { priceKey, sessionId });
        return NextResponse.json({ success: false }, { status: 500 });
    }

    const email = session.customer_email!;
    const profile = await getUserProfileByEmail(email);

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await updateUserSubscriptionTier(profile.uid, tier);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error confirming Stripe session", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
