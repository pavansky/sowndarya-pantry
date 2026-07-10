-- Sow's Pantry — multi-tenant migration. Run once in Supabase → SQL Editor.
-- Turns the single shared "state" row into per-user, RLS-isolated data + a plan/subscription table.

-- 1) Per-user pantry/plan state (one row per signed-in user, isolated by RLS)
create table if not exists user_state (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
alter table user_state enable row level security;
create policy "own_state_select" on user_state for select using (auth.uid() = user_id);
create policy "own_state_insert" on user_state for insert with check (auth.uid() = user_id);
create policy "own_state_update" on user_state for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2) Plan / subscription status. Users can READ their own; only the Stripe webhook
--    (service-role key, bypasses RLS) WRITES 'pro' after a successful payment.
create table if not exists profiles (
  user_id             uuid primary key references auth.users(id) on delete cascade,
  email               text,
  plan                text not null default 'free',   -- 'free' | 'pro'
  stripe_customer_id  text,
  current_period_end  timestamptz,
  updated_at          timestamptz not null default now()
);
alter table profiles enable row level security;
create policy "own_profile_select" on profiles for select using (auth.uid() = user_id);

-- 3) Auto-create a profile row on every new signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (user_id, email) values (new.id, new.email)
  on conflict (user_id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- Note: the old wide-open "state"/"anon_all" table from the family version can be dropped
-- once you've migrated, or left as-is. The product uses user_state + profiles above.
