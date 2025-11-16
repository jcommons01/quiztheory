This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Configuration

Environment variables (create a `.env.local` in the project root):

- STRIPE_SECRET_KEY: Your Stripe secret API key used by the subscription checkout endpoint.
- STRIPE_WEBHOOK_SECRET: Your Stripe webhook signing secret for verifying incoming events.
- STRIPE_PRICE_PRO: (Optional) Stripe price ID that maps to the "pro" tier.
- STRIPE_PRICE_TEAM: (Optional) Stripe price ID that maps to the "team" tier.

Authentication:

- Server routes and middleware expect a `session` cookie containing the authenticated user's UID. Ensure your sign-in flow sets this cookie on successful login.

Stripe Checkout:

- The API route `POST /api/stripe/create-checkout-session` accepts `{ priceId: string }` in the JSON body and returns `{ url: string }` to redirect the browser to Stripe Checkout. On success, users are redirected back to `/dashboard?upgrade=success`; on cancel, to `/pricing?canceled=1`.

Stripe Webhooks:

- Configure your Stripe webhook endpoint to `POST /api/stripe/webhook` and include events:
	- `checkout.session.completed`
	- `customer.subscription.updated` (and optionally `customer.subscription.created`)
- The webhook verifies the signature using `STRIPE_WEBHOOK_SECRET` and updates `users/{uid}` with `stripeCustomerId` and `subscriptionTier` based on your configured price IDs.
