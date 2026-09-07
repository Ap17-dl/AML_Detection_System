import { describe, expect, it } from "vitest";

import { navItemsForRole } from "@/lib/nav-items";

describe("navItemsForRole", () => {
  it("shows every nav item, including Administration, to an administrator", () => {
    const labels = navItemsForRole("administrator").map((item) => item.label);
    expect(labels).toContain("Administration");
    expect(labels).toContain("Alerts");
    expect(labels).toContain("Dashboard");
  });

  it("hides Administration from an AML analyst but keeps case-work items", () => {
    const labels = navItemsForRole("aml_analyst").map((item) => item.label);
    expect(labels).not.toContain("Administration");
    expect(labels).toContain("Alerts");
    expect(labels).toContain("Customers");
    expect(labels).toContain("Network Explorer");
  });

  it("hides Alerts, Customers, and Administration from a data operator", () => {
    const labels = navItemsForRole("data_operator").map((item) => item.label);
    expect(labels).not.toContain("Administration");
    expect(labels).not.toContain("Alerts");
    expect(labels).not.toContain("Customers");
    expect(labels).toContain("Dashboard");
    expect(labels).toContain("Transactions");
  });
});
