import type { Role } from "@/types/auth";

export interface NavItem {
  label: string;
  /** Omitted for sections whose screens land in a later sprint (Design Scheme §3/§9). */
  href?: string;
  roles: Role[];
}

const ALL_STAFF: Role[] = ["administrator", "aml_analyst", "data_operator"];
const ANALYST_AND_ADMIN: Role[] = ["administrator", "aml_analyst"];

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", roles: ALL_STAFF },
  { label: "Transactions", href: "/transactions", roles: ALL_STAFF },
  { label: "Alerts", href: "/alerts", roles: ANALYST_AND_ADMIN },
  { label: "Customers", href: "/customers", roles: ANALYST_AND_ADMIN },
  { label: "Network Explorer", href: "/network", roles: ANALYST_AND_ADMIN },
  { label: "Reports", href: "/reports", roles: ANALYST_AND_ADMIN },
  { label: "Administration", href: "/admin", roles: ["administrator"] },
];

export function navItemsForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
