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
  { label: "Transactions", roles: ALL_STAFF },
  { label: "Alerts", roles: ANALYST_AND_ADMIN },
  { label: "Customers", roles: ANALYST_AND_ADMIN },
  { label: "Network Explorer", roles: ANALYST_AND_ADMIN },
  { label: "Reports", roles: ANALYST_AND_ADMIN },
  { label: "Administration", roles: ["administrator"] },
];

export function navItemsForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
