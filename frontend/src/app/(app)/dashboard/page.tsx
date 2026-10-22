import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import DashboardClient from "@/components/dashboard/DashboardClient";
import { fetchCurrentUser } from "@/lib/api";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const devToken = cookieStore.get("aml_dev_token")?.value;

  let accessToken = devToken;
  let role = "data_operator";

  if (devToken) {
    // Dev mode — use the dev token directly, fetch role from backend
    try {
      const user = await fetchCurrentUser(devToken);
      role = user.role;
    } catch {
      // Backend may be down; continue with default role
    }
  } else {
    // Production mode — get session from Supabase (layout already validated auth,
    // so getSession() here only reads the local cookie, no network re-validation)
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      redirect("/login");
    }

    accessToken = session.access_token;

    try {
      const user = await fetchCurrentUser(session.access_token);
      role = user.role;
    } catch {
      // Layout already validated auth — if fetchCurrentUser fails here, use default role
    }
  }

  if (!accessToken) {
    redirect("/login");
  }

  return (
    <div className="p-6">
      <DashboardClient
        accessToken={accessToken}
        apiBaseUrl={env.apiBaseUrl}
        role={role}
      />
    </div>
  );
}
