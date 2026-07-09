# 🥗 Sowndarya's Pantry

Family pantry + grocery + healthy-meal app. One static file, works offline, installs to the
home screen on iPad / iPhone / Pixel. Shared data across devices via free Supabase sync.

## What it does
- **Pantry** — track stock by weight/count, `+`/`−` to adjust, alert threshold per item.
- **Cook** — "I made *X* for *N* people" → deducts scaled ingredients from the pantry automatically.
- **Meals** — healthy daily + weekly plan; shows what you *can make* with current stock.
- **Order** — low items auto-appear as a grocery list; **Share** sends it to Pavan (WhatsApp/SMS).
  Tap "+ to pantry" after shopping to restock.
- Add your own pantry items and dishes (with per-person ingredient amounts).

## Deploy to Vercel (2 min)
1. Push this folder to a GitHub repo (or drag it into Vercel).
2. [vercel.com/new](https://vercel.com/new) → import → **Framework: Other**, no build command. Deploy.
3. Open the URL on each device → Share sheet → **Add to Home Screen**.

It's a pure static site — nothing to build, no server.

## Turn on shared sync (so both phones see the same pantry)
Without this, each device keeps its own copy. To share one pantry:
1. Create a free project at [supabase.com](https://supabase.com).
2. Supabase → **SQL editor**, run:
   ```sql
   create table if not exists state (id text primary key, data jsonb, updated_at timestamptz);
   alter table state enable row level security;
   create policy anon_all on state for all to anon using (true) with check (true);
   ```
3. In the app tap **⚙︎** → paste your **Project URL** and **anon key** (Supabase → Settings → API),
   keep the same **Household code** on every device → **Save & sync**.

Data syncs on save and when you reopen the app (last-write-wins). No sync? The app still works fully
per-device, and **Export/Import** in ⚙︎ is a manual backup/transfer.

> Note: the `anon_all` policy makes the row readable by anyone who has your URL+key. Fine for a private
> household deployment; add Supabase Auth if you ever expose it publicly.

## Ping Pavan on Telegram (optional, free, no server)
So the Order list can push straight to your phone:
1. Telegram → **@BotFather** → `/newbot` → copy the **token**.
2. Message your new bot once, then open
   `https://api.telegram.org/bot<token>/getUpdates` and copy the **chat id** (use a group's id to reach both of you).
3. App ⚙︎ → paste **bot token** + **chat id** → Save. Order tab now has a **📲 Telegram** button.

Telegram's API allows browser calls, so this needs no backend. (Slack incoming webhooks block browser CORS,
so they'd need a proxy — that's why Telegram is the default here.)
