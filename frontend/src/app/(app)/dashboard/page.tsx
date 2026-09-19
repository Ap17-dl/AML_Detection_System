import { redirect } from "next/navigation";

import DashboardClient from "@/components/dashboard/DashboardClient";
import { fetchCurrentUser } from "@/lib/api";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await fetchCurrentUser(session.access_token);

  return (
    <div className="p-6">
      <DashboardClient
        accessToken={session.access_token}
        apiBaseUrl={env.apiBaseUrl}
        role={user.role}
      />
    </div>
  );
}
