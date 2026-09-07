/** Mirrors the role_name values seeded in public.roles (03_Backend_Schema.md §3.1). */
export type Role = "administrator" | "aml_analyst" | "data_operator";

/** Shape of GET /api/v1/auth/me. */
export interface CurrentUser {
  user_id: string;
  email: string;
  full_name: string | null;
  role: Role;
}
