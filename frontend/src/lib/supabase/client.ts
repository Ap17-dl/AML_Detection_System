import { createBrowserClient } from "@supabase/ssr";

import { env } from "@/lib/env";

/** Browser-side Supabase client — used from Client Components (e.g. the login form). */
export function createClient() {
  return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
}
