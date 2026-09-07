"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navItemsForRole } from "@/lib/nav-items";
import type { Role } from "@/types/auth";

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = navItemsForRole(role);

  return (
    <nav
      aria-label="Primary"
      className="border-border bg-surface flex w-64 shrink-0 flex-col gap-1 border-r p-4"
    >
      <span className="text-label text-text-secondary px-3 pb-3">
        AML Platform
      </span>
      {items.map((item) =>
        item.href ? (
          <Link
            key={item.label}
            href={item.href}
            className={`text-body rounded-md px-3 py-2 transition-colors ${
              pathname === item.href
                ? "bg-accent/10 text-accent font-medium"
                : "text-text-primary hover:bg-bg"
            }`}
          >
            {item.label}
          </Link>
        ) : (
          <span
            key={item.label}
            title="Coming in a later sprint"
            className="text-body text-text-secondary cursor-not-allowed rounded-md px-3 py-2"
          >
            {item.label}
          </span>
        ),
      )}
    </nav>
  );
}
