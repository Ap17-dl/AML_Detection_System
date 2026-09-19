import { redirect } from "next/navigation";

import ReportsClient from "@/components/reports/ReportsClient";
import { fetchCurrentUser } from "@/lib/api";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function ReportsPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await fetchCurrentUser(session.access_token);
  if (user.role === "data_operator") {
    redirect("/dashboard");
  }

  return (
    <div className="p-6">
      <ReportsClient
        accessToken={session.access_token}
        apiBaseUrl={env.apiBaseUrl}
      />
    </div>
  );
}
