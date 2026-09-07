import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

import { Sidebar } from "@/components/layout/Sidebar";

describe("Sidebar", () => {
  it("renders Administration as a link only for an administrator", () => {
    render(<Sidebar role="administrator" />);
    const link = screen.getByRole("link", { name: "Dashboard" });
    expect(link).toHaveAttribute("href", "/dashboard");
    expect(screen.getByText("Administration").tagName).not.toBe("A");
  });

  it("omits Administration entirely from the sidebar for a data operator's view", () => {
    render(<Sidebar role="data_operator" />);
    expect(screen.queryByText("Administration")).not.toBeInTheDocument();
    expect(screen.queryByText("Alerts")).not.toBeInTheDocument();
  });
});
