# TimeToLive Classic — one-time cloud setup

The Classic app uses the **same Supabase project and the same login** as the new app,
but saves your data to its **own table** (`app_state_classic`). The two apps can never
overwrite each other.

## Run this once in Supabase

Supabase → your project → **SQL Editor** → **New query** → paste → **Run**.

```sql
create table if not exists public.app_state_classic (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_state_classic enable row level security;

create policy "classic own row - read"   on public.app_state_classic for select using (auth.uid() = user_id);
create policy "classic own row - add"    on public.app_state_classic for insert with check (auth.uid() = user_id);
create policy "classic own row - change" on public.app_state_classic for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "classic own row - delete" on public.app_state_classic for delete using (auth.uid() = user_id);
```

You should see **Success. No rows returned.**

Until this is run, the Classic app still works on your device; it just shows a sync error.
