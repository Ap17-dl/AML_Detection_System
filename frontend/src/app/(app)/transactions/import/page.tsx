import { redirect } from "next/navigation";

import ImportClient from "@/components/transactions/ImportClient";
import { fetchCurrentUser } from "@/lib/api";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * CSV Import page — only accessible to Data Operators and Administrators.
 */
export default async function ImportPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await fetchCurrentUser(session.access_token);

  // Only data_operator and administrator can import
  if (user.role !== "administrator" && user.role !== "data_operator") {
    redirect("/transactions");
  }

  return (
    <div className="p-6">
      <ImportClient
        accessToken={session.access_token}
        apiBaseUrl={env.apiBaseUrl}
      />
    </div>
  );
}
