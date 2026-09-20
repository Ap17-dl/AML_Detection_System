import { cookies } from "next/headers";

import { LandingView } from "@/components/landing/LandingView";
import { createClient } from "@/lib/supabase/server";

export default async function RootPage() {
  const cookieStore = await cookies();
  const devToken = cookieStore.get("aml_dev_token")?.value;

  let isAuthenticated = !!devToken;
  let userEmail: string | null = null;

  if (!isAuthenticated) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        isAuthenticated = true;
        userEmail = user.email ?? null;
      }
    } catch {
      // Supabase unconfigured or offline in local development
    }
  }

  return (
    <LandingView isAuthenticated={isAuthenticated} userEmail={userEmail} />
  );
}
