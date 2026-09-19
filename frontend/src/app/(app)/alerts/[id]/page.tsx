import { redirect } from "next/navigation";

import AlertDetailClient from "@/components/alerts/AlertDetailClient";
import { fetchCurrentUser } from "@/lib/api";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AlertDetailPage({ params }: PageProps) {
  const { id } = await params;
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
      <AlertDetailClient
        alertId={id}
        accessToken={session.access_token}
        apiBaseUrl={env.apiBaseUrl}
      />
    </div>
  );
}
