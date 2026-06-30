import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabaseConfig";

// Only create a real client once valid-looking credentials are present.
// If still on placeholders, `supabase` is null and the app runs in local-only
// mode (every cloud call is guarded with `if (!supabase) ...`).
const looksConfigured =
  typeof SUPABASE_URL === "string" &&
  SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("YOUR-PROJECT-ID") &&
  typeof SUPABASE_ANON_KEY === "string" &&
  SUPABASE_ANON_KEY.length > 20 &&
  !SUPABASE_ANON_KEY.includes("YOUR-ANON");

export const supabase = looksConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

export const isSyncConfigured = !!supabase;

// One row per user holds the whole app state as JSON.
export const STATE_TABLE = "app_state";
