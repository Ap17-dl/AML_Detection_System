import { redirect } from "next/navigation";

import CustomersClient from "@/components/customers/CustomersClient";
import { fetchCurrentUser } from "@/lib/api";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function CustomersPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Verify role — only analyst + admin can view customers
  const user = await fetchCurrentUser(session.access_token);
  if (user.role === "data_operator") {
    redirect("/dashboard");
  }

  return (
    <div className="p-6">
      <CustomersClient
        accessToken={session.access_token}
        apiBaseUrl={env.apiBaseUrl}
      />
    </div>
  );
}
