import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const refresh = vi.fn();
const signUp = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signUp } }),
}));

import { SignUpForm } from "@/app/signup/SignUpForm";

describe("SignUpForm", () => {
  beforeEach(() => {
    push.mockClear();
    refresh.mockClear();
    signUp.mockReset();
  });

  it("shows error when password is less than 6 characters", async () => {
    render(<SignUpForm />);

    fireEvent.change(screen.getByLabelText(/Full name/i), {
      target: { value: "Jane Doe" },
    });
    fireEvent.change(screen.getByLabelText(/Email address/i), {
      target: { value: "jane@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^Password/i), {
      target: { value: "123" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm password/i), {
      target: { value: "123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Password must be at least 6 characters.",
    );
    expect(signUp).not.toHaveBeenCalled();
  });

  it("shows error when passwords do not match", async () => {
    render(<SignUpForm />);

    fireEvent.change(screen.getByLabelText(/Full name/i), {
      target: { value: "Jane Doe" },
    });
    fireEvent.change(screen.getByLabelText(/Email address/i), {
      target: { value: "jane@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^Password/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm password/i), {
      target: { value: "password456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Passwords do not match.",
    );
    expect(signUp).not.toHaveBeenCalled();
  });

  it("redirects to dashboard when signup returns an active session", async () => {
    signUp.mockResolvedValue({
      data: {
        session: { access_token: "test-token" },
        user: { id: "user-123" },
      },
      error: null,
    });

    render(<SignUpForm />);

    fireEvent.change(screen.getByLabelText(/Full name/i), {
      target: { value: "Jane Doe" },
    });
    fireEvent.change(screen.getByLabelText(/Email address/i), {
      target: { value: "jane@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Platform role/i), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText(/^Password/i), {
      target: { value: "securepassword123" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm password/i), {
      target: { value: "securepassword123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard"));
    expect(signUp).toHaveBeenCalledWith({
      email: "jane@example.com",
      password: "securepassword123",
      options: {
        data: {
          full_name: "Jane Doe",
          role_id: 2,
        },
        emailRedirectTo: expect.stringContaining("/dashboard"),
      },
    });
  });

  it("shows check your email notice when signup requires confirmation", async () => {
    signUp.mockResolvedValue({
      data: {
        session: null,
        user: { id: "user-123" },
      },
      error: null,
    });

    render(<SignUpForm />);

    fireEvent.change(screen.getByLabelText(/Full name/i), {
      target: { value: "Jane Doe" },
    });
    fireEvent.change(screen.getByLabelText(/Email address/i), {
      target: { value: "jane@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^Password/i), {
      target: { value: "securepassword123" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm password/i), {
      target: { value: "securepassword123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Check your email")).toBeInTheDocument();
    expect(
      screen.getByText(/We've sent a confirmation link to/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Return to sign in" }),
    ).toHaveAttribute("href", "/login");
  });

  it("displays error message from Supabase auth rejection", async () => {
    signUp.mockResolvedValue({
      data: { session: null, user: null },
      error: { message: "User already registered" },
    });

    render(<SignUpForm />);

    fireEvent.change(screen.getByLabelText(/Full name/i), {
      target: { value: "Jane Doe" },
    });
    fireEvent.change(screen.getByLabelText(/Email address/i), {
      target: { value: "existing@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^Password/i), {
      target: { value: "securepassword123" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm password/i), {
      target: { value: "securepassword123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "User already registered",
    );
  });

  it("does not offer Administrator as a selectable signup role", () => {
    render(<SignUpForm />);
    const roleSelect = screen.getByLabelText(/Platform role/i);
    const options = Array.from(roleSelect.querySelectorAll("option")).map(
      (opt) => opt.textContent,
    );
    expect(options.some((text) => text?.includes("Administrator"))).toBe(false);
    expect(
      screen.getByText(/Need Administrator access\? You can request it from the host after signing in\./i),
    ).toBeInTheDocument();
  });
});
