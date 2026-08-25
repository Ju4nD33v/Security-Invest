import { createClient } from "@supabase/supabase-js";
import { getServerEnv, getSupabaseServerKey } from "@/src/server/config/env";

export function createAdminSupabaseClient() {
  const env = getServerEnv();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, getSupabaseServerKey(), {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}
