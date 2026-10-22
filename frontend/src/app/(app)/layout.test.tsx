import { describe, expect, it, vi } from "vitest";

const { redirect, getSession, fetchCurrentUser } = vi.hoisted(() => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
  getSession: vi.fn(),
  fetchCurrentUser: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getSession } }),
}));
vi.mock("@/lib/api", () => ({ fetchCurrentUser }));

import AppLayout from "@/app/(app)/layout";

describe("(app) layout — protected route wrapper", () => {
  it("redirects unauthenticated visitors to /login without calling the API", async () => {
    getSession.mockResolvedValue({
      data: { session: null },
    });

    await expect(AppLayout({ children: null })).rejects.toThrow(
      "REDIRECT:/login",
    );
    expect(fetchCurrentUser).not.toHaveBeenCalled();
  });

  it("renders the app shell for an authenticated user", async () => {
    getSession.mockResolvedValue({
      data: { session: { access_token: "token-123" } },
    });
    fetchCurrentUser.mockResolvedValue({
      user_id: "u1",
      email: "analyst@example.com",
      full_name: "Analyst One",
      role: "aml_analyst",
    });

    const result = await AppLayout({ children: "content" });

    expect(fetchCurrentUser).toHaveBeenCalledWith("token-123");
    expect(result.props.user.role).toBe("aml_analyst");
    expect(result.props.children).toBe("content");
  });
});
