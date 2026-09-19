import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/lib/env";

/**
 * Refreshes the Supabase session cookie on every request. Required because Server Components
 * cannot write cookies themselves — without this, a session nearing expiry would silently drop
 * partway through navigation. Route protection itself lives in the `(app)` layout, which reads
 * the (now-fresh) session server-side and redirects to /login if it's missing.
 */
export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });
  const devToken = request.cookies.get("aml_dev_token")?.value;
  if (devToken) {
    return response;
  }

  try {
    const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    });

    await supabase.auth.getUser();
  } catch {
    // Supabase remote unreachable; safe to continue
  }

  return response;
}
