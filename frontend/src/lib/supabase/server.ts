import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { env } from "@/lib/env";

/**
 * Server-side Supabase client for Server Components/Actions. Cookie writes are wrapped in
 * try/catch because Server Components can't set cookies — session refresh there is a no-op
 * and is instead handled by `middleware.ts` on every request.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const devToken = cookieStore.get("aml_dev_token")?.value;

  const client = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component — safe to ignore, middleware refreshes the session.
        }
      },
    },
  });

  if (devToken) {
    const origGetUser = client.auth.getUser.bind(client.auth);
    const origGetSession = client.auth.getSession.bind(client.auth);

    client.auth.getUser = async (jwt?: string) => {
      try {
        const res = await origGetUser(jwt);
        if (res.data?.user) return res;
      } catch {
        // Fallback to dev user
      }
      return {
        data: {
          user: {
            id: "dev-user",
            app_metadata: {},
            user_metadata: {},
            aud: "authenticated",
            created_at: new Date().toISOString(),
          } as never,
        },
        error: null,
      };
    };

    client.auth.getSession = async () => {
      try {
        const res = await origGetSession();
        if (res.data?.session) return res;
      } catch {
        // Fallback to dev session
      }
      return {
        data: {
          session: {
            access_token: devToken,
            token_type: "bearer",
            user: {
              id: "dev-user",
              app_metadata: {},
              user_metadata: {},
              aud: "authenticated",
              created_at: new Date().toISOString(),
            } as never,
          } as never,
        },
        error: null,
      };
    };
  }

  return client;
}
