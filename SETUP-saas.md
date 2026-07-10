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

## C. Meal validation & the free-first earn loop (verified plan)
Model (from the monetization workflow): **the whole app is free**; logging a photo meal that AI-validates
as healthy earns **premium days** (1/meal, capped **5/week** so it can't be farmed). Premium = AI extras
(unlimited scans, AI coaching, analytics) at **~₹299/mo** — or ₹0 by earning it. Primary revenue is the
**AI-freemium subscription**; grocery affiliate is NOT a pillar (India cuts are tiny). B2B employer
wellness is the long-term pillar, not launch.

**To enable validation:** add `ANTHROPIC_API_KEY` in Vercel env vars. `/api/validate-meal` uses Claude
vision (Haiku) to return a neutral `band` (healthy / partial / not_a_plate) — reward-gating only.

**Ethical guardrails baked in (from the verification audit — keep them):**
- Earned Premium is framed as a **bonus you keep**, never a manufactured "loss"; no guilt/countdown copy.
- Users are **never shown a "junk/unhealthy" label** — a non-healthy meal is just logged, no reward, no shaming.
- **Streaks are never monetized** (no paid streak-freeze); repair is free.
- **18+** the earn/scoring mechanics; add an ED-risk off-ramp.
- Anti-gaming to add server-side before scaling: DB unique (user, meal, day), server timestamp, pHash
  dedup, reverse-image/AI-image checks on day-earning meals. Strip EXIF/GPS on ingest; short photo retention; DPA with the vision API.
