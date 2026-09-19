import { redirect } from "next/navigation";

import AlertsClient from "@/components/alerts/AlertsClient";
import { fetchCurrentUser } from "@/lib/api";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function AlertsPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Only Analyst and Admin can view alerts
  const user = await fetchCurrentUser(session.access_token);
  if (user.role === "data_operator") {
    redirect("/dashboard");
  }

  return (
    <div className="p-6">
      <AlertsClient
        accessToken={session.access_token}
        apiBaseUrl={env.apiBaseUrl}
      />
    </div>
  );
}
