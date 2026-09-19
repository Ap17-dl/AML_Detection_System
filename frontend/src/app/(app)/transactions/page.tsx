import { redirect } from "next/navigation";

import TransactionsClient from "@/components/transactions/TransactionsClient";
import { fetchCurrentUser } from "@/lib/api";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Transaction Monitor page — server component that fetches the session and renders
 * the client-side TransactionsClient with the access token and role info.
 */
export default async function TransactionsPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await fetchCurrentUser(session.access_token);
  const canImport =
    user.role === "administrator" || user.role === "data_operator";

  return (
    <div className="p-6">
      <TransactionsClient
        accessToken={session.access_token}
        apiBaseUrl={env.apiBaseUrl}
        canImport={canImport}
      />
    </div>
  );
}
