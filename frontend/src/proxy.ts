import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/update-session";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on every request except static assets, so the session cookie stays fresh across
     * navigations without re-fetching it for images/fonts/etc.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)",
  ],
};
