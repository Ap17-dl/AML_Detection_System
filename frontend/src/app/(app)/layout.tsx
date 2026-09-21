import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { ApiError, fetchCurrentUser } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";

/**
 * Protected route wrapper for every authenticated screen (Sprint 1 exit criterion: unauthorized
 * users are blocked). Runs server-side before any page content streams to the client.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const devToken = cookieStore.get("aml_dev_token")?.value;

  let accessToken = devToken;

  if (!accessToken) {
    const supabase = await createClient();

    // getUser() re-validates the JWT against Supabase Auth (unlike getSession(), which only reads
    // the local cookie) — the stronger check to gate on before trusting the session at all.
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      redirect("/login");
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      redirect("/login");
    }

    accessToken = session.access_token;
  }

  let currentUser;
  try {
    currentUser = await fetchCurrentUser(accessToken);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/login");
    }
    return (
      <div className="bg-brand-bgLight dark:bg-bg flex min-h-screen items-center justify-center p-8">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-8 text-center shadow-xl backdrop-blur-md">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
            <span className="material-symbols-outlined text-3xl">error</span>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Couldn&apos;t load your profile
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            The surveillance service may be initializing or your session needs to be refreshed.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <a
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold hover:bg-gold-dark px-5 py-2.5 text-sm font-semibold text-brand-dark transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-base">login</span>
              Return to Login
            </a>
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              <span className="material-symbols-outlined text-base">refresh</span>
              Retry Connection
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <AppShell user={currentUser}>{children}</AppShell>;
}
