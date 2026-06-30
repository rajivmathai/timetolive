# TimeToLive — Cloud Sync Setup (Supabase)

This guide turns on accounts + cross-device sync. You do this **once**. It takes about 15 minutes. The app keeps working locally the whole time — sync just switches on once you finish.

There are 4 parts: create a project → set up the database → paste 2 keys → deploy.

---

## Part 1 — Create your free Supabase project

1. Go to **https://supabase.com** and click **Start your project**. Sign in with GitHub (you already have an account).
2. Click **New project**.
3. Fill in:
   - **Name:** `timetolive`
   - **Database Password:** click **Generate a password** and **save it somewhere safe** (you won't need it day-to-day, but don't lose it).
   - **Region:** pick the one closest to you (e.g. *Sydney* for Australia).
4. Click **Create new project** and wait ~2 minutes while it sets up.

---

## Part 2 — Create the data table + security rules

This makes a place to store each person's data, and locks it down so people can only ever see their **own** data.

1. In your project, click the **SQL Editor** icon in the left sidebar (looks like a terminal/`>_`).
2. Click **New query**, paste in everything below, and click **Run** (or press Cmd+Enter):

```sql
-- One row per user holds their entire app state as JSON.
create table if not exists public.app_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Turn on Row Level Security: by default, nobody can read or write anything...
alter table public.app_state enable row level security;

-- ...except their OWN row. These four rules allow exactly that.
create policy "own row - read"   on public.app_state for select using (auth.uid() = user_id);
create policy "own row - add"    on public.app_state for insert with check (auth.uid() = user_id);
create policy "own row - change" on public.app_state for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own row - delete" on public.app_state for delete using (auth.uid() = user_id);
```

3. You should see **Success. No rows returned**. That's correct — it built the table and the rules.

---

## Part 3 — Paste your 2 keys into the app

1. In Supabase, click **Project Settings** (gear icon, bottom-left) → **API**.
2. You'll see two values you need:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **Project API keys → `anon` `public`** (a long string)
3. Open the file **`src/supabaseConfig.js`** in your project and replace the two placeholders:

```js
export const SUPABASE_URL = "https://abcdefgh.supabase.co";   // your Project URL
export const SUPABASE_ANON_KEY = "eyJhbGci...your-long-anon-key...";
```

**These two values are safe to be public.** They're designed to live in the browser. The security rules from Part 2 are what actually protect the data — nobody can read another person's data even with these keys.

---

## Part 4 — (Recommended) Make testing easier

By default, Supabase makes new users confirm their email before they can sign in. For a small group of testers that's an extra step. You can keep it on (more secure) or turn it off (less friction):

- **Project Settings → Authentication → Providers → Email** → toggle **Confirm email** off if you want testers to sign in immediately after signing up.

Either choice is fine. You can change it any time.

---

## Part 5 — Deploy

Deploy exactly like always: commit and push in GitHub Desktop, let Vercel rebuild, then fully close and reopen the app. Once it's live:

- Open **Settings → Account & Sync** (or tap the "Sign in to sync" pill at the top) → **Create account**.
- Do the same on your other device with the **same email + password** → your data appears on both.

That's it — you now have real accounts and cross-device sync.

---

### Good to know

- **Cost:** a personal app with a few testers sits comfortably in Supabase's free tier ($0). Limits can change, so glance at their pricing page if you grow.
- **"Last save wins":** if you edit the same thing on two devices at once, the most recent save wins. As a solo user one device at a time, you'll rarely hit this.
- **Your data, your responsibility:** once data is in the cloud you're its custodian. At this scale that's simple, but it's a real shift from device-only storage.
- **If you ever rotate keys** or see "sync error," re-check the two values in `src/supabaseConfig.js` against Project Settings → API.
