import { redirect } from "next/navigation";

import AdminClient from "@/components/admin/AdminClient";
import { fetchCurrentUser } from "@/lib/api";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Only Administrator role can access Administration
  const user = await fetchCurrentUser(session.access_token);
  if (user.role !== "administrator") {
    redirect("/dashboard");
  }

  return (
    <div className="p-6">
      <AdminClient
        accessToken={session.access_token}
        apiBaseUrl={env.apiBaseUrl}
      />
    </div>
  );
}
