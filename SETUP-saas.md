# Sow's Pantry — SaaS setup checklist

Stage 1 (marketing site + app restructure) is **done and live**. To turn on **accounts** and
**billing**, complete the steps below — then I'll wire the in-app login + Stripe checkout.

## A. Supabase — accounts & per-user data
1. **Rotate the secret key** you exposed earlier (Settings → API → regenerate `sb_secret…`).
2. Run **`supabase-multitenant.sql`** in Supabase → SQL Editor (creates `user_state`, `profiles`, RLS, signup trigger).
3. **Auth** is on by default (email/password + magic link). Optional: enable Google in Authentication → Providers.
4. Add your site to **Authentication → URL Configuration → Redirect URLs**: `https://pantry-rho-seven.vercel.app/app.html` (and your custom domain later).

## B. Stripe — billing (I build the code; these are yours)
1. Create a free **Stripe** account.
2. Add a **Product** "Longevity Pro" with two **Prices**: $4.99/month and $39/year. Copy their price IDs.
3. Grab your **Secret key** (`sk_…`) and create a **webhook signing secret** (after I add the endpoint).
4. In **Vercel → Project → Settings → Environment Variables**, add:
   - `STRIPE_SECRET_KEY`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`, `STRIPE_WEBHOOK_SECRET`
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (webhook writes `plan='pro'` server-side)

## What I build next (once A + B are ready)
- In-app **Sign up / Log in** (Supabase Auth), per-user data via the session token (RLS-isolated).
- `/api/checkout` (creates a Stripe Checkout session) and `/api/stripe-webhook` (marks the user Pro).
- **Pro gating**: multi-device sync, Telegram push, photos, custom recipes behind the Pro plan.
- Migrate the current family data to your own account.

The Supabase **anon/publishable** key is safe to ship in the client (security comes from RLS + Auth) —
so the app will come pre-configured; users just sign up, no key-pasting.
