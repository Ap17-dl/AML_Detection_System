/** Mirrors the role_name values seeded in public.roles (03_Backend_Schema.md §3.1). */
export type Role = "administrator" | "aml_analyst" | "data_operator";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  status: "active" | "suspended" | "inactive";
  created_at: string;
  updated_at: string;
  admin_count?: number;
  analyst_count?: number;
  operator_count?: number;
  total_users?: number;
}

/** Shape of GET /api/v1/auth/me. */
export interface CurrentUser {
  user_id: string;
  email: string;
  full_name: string | null;
  role: Role;
  organization_id?: string | null;
  organization_name?: string | null;
  organization_status?: string | null;
}
