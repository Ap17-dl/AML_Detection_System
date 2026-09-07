import { env } from "@/lib/env";
import type { CurrentUser } from "@/types/auth";

/** Thrown when the backend responds with the shared error envelope (TRD §5). */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiFetch<T>(path: string, accessToken: string): Promise<T> {
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const error = body?.error ?? {
      code: "unknown_error",
      message: response.statusText,
    };
    throw new ApiError(response.status, error.code, error.message);
  }

  return response.json();
}

/** Calls GET /api/v1/auth/me — the source of truth for the signed-in user's role. */
export function fetchCurrentUser(accessToken: string): Promise<CurrentUser> {
  return apiFetch<CurrentUser>("/api/v1/auth/me", accessToken);
}
