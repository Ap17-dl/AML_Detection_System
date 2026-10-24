import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import DashboardClient from "@/components/dashboard/DashboardClient";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const devToken = cookieStore.get("aml_dev_token")?.value;

  let accessToken = devToken;
  let role = "aml_analyst";

  if (devToken) {
    try {
      const payloadBase64 = devToken.split(".")[1];
      if (payloadBase64) {
        const payload = JSON.parse(
          Buffer.from(payloadBase64, "base64").toString("utf8"),
        );
        role = payload.role || payload.role_name || "aml_analyst";
      }
    } catch {
      role = "aml_analyst";
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
      const payloadBase64 = session.access_token.split(".")[1];
      if (payloadBase64) {
        const payload = JSON.parse(
          Buffer.from(payloadBase64, "base64").toString("utf8"),
        );
        role =
          payload.user_metadata?.role_name ||
          payload.app_metadata?.role_name ||
          (payload.user_metadata?.role_id === 3
            ? "data_operator"
            : "aml_analyst");
      }
    } catch {
      role = "aml_analyst";
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
