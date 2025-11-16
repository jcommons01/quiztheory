import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

// Omit apiVersion to use the account's default version and avoid TS literal mismatches
export const stripe = new Stripe(secretKey);
