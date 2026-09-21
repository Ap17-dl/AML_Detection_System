import type { ReactNode } from "react";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import type { CurrentUser } from "@/types/auth";

export function AppShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: ReactNode;
}) {
  return (
    <div className="bg-brand-bgLight dark:bg-bg flex min-h-screen text-brand-dark dark:text-text-primary antialiased">
      <Sidebar role={user.role} />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Topbar user={user} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-7xl w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
