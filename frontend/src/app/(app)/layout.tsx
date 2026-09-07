import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { fetchCurrentUser } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";

/**
 * Protected route wrapper for every authenticated screen (Sprint 1 exit criterion: unauthorized
 * users are blocked). Runs server-side before any page content streams to the client.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
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

  let currentUser;
  try {
    currentUser = await fetchCurrentUser(session.access_token);
  } catch {
    return (
      <div className="bg-bg flex min-h-screen items-center justify-center p-8">
        <div className="text-center">
          <p className="text-h3 text-text-primary">
            Couldn&apos;t load your profile
          </p>
          <p className="text-body text-text-secondary mt-2">
            The API may be unavailable right now. Please try again shortly.
          </p>
        </div>
      </div>
    );
  }

  return <AppShell user={currentUser}>{children}</AppShell>;
}
