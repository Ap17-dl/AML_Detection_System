"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { DataTable, type Column } from "@/components/ui/DataTable";

interface OrganizationStats {
  id: string;
  name: string;
  slug: string;
  status: string;
  total_users: number;
  admin_count: number;
  analyst_count: number;
  operator_count: number;
  recent_activity: Array<{
    audit_id: string;
    action: string;
    entity_type?: string | null;
    user_email?: string | null;
    details?: Record<string, unknown> | null;
    created_at?: string | null;
  }>;
}

interface UserItem {
  user_id: string;
  email: string;
  full_name?: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login_at?: string | null;
  organization_id?: string | null;
  organization_name?: string | null;
}

interface ModelMeta {
  model_version: string;
  algorithm: string;
  precision_score: number | null;
  recall_score: number | null;
  f1_score: number | null;
  pr_auc: number | null;
  roc_auc: number | null;
  threshold_low_max: number;
  threshold_medium_max: number;
  is_active: boolean;
}

interface AuditLogItem {
  audit_id: string;
  user_email?: string | null;
  action: string;
  entity_type?: string | null;
  created_at: string;
}

interface AdminClientProps {
  accessToken: string;
  apiBaseUrl: string;
}

export default function AdminClient({
  accessToken,
  apiBaseUrl,
}: AdminClientProps) {
  const [activeTab, setActiveTab] = useState<
    "organization" | "users" | "models" | "audit"
  >("users");

  // Organization stats
  const [orgStats, setOrgStats] = useState<OrganizationStats | null>(null);
  const [loadingOrg, setLoadingOrg] = useState(false);

  // Users state
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // User Actions State
  const [selectedUserToChangeRole, setSelectedUserToChangeRole] =
    useState<UserItem | null>(null);
  const [newRoleVal, setNewRoleVal] = useState<string>("aml_analyst");
  const [roleChangeError, setRoleChangeError] = useState<string | null>(null);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("aml_analyst");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [submittingInvite, setSubmittingInvite] = useState(false);

  // Confirmation modal state (for toggle status or delete)
  const [confirmModal, setConfirmModal] = useState<{
    type: "status" | "delete";
    user: UserItem;
  } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Models state
  const [models, setModels] = useState<ModelMeta[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  // Audit state
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const fetchOrgStats = useCallback(async () => {
    setLoadingOrg(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/organizations/current`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        setOrgStats(await res.json());
      }
    } finally {
      setLoadingOrg(false);
    }
  }, [accessToken, apiBaseUrl]);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/users`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        setUsers(await res.json());
      }
    } finally {
      setLoadingUsers(false);
    }
  }, [accessToken, apiBaseUrl]);

  const fetchModels = useCallback(async () => {
    setLoadingModels(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/models`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) setModels(await res.json());
    } finally {
      setLoadingModels(false);
    }
  }, [accessToken, apiBaseUrl]);

  const fetchAuditLogs = useCallback(async () => {
    setLoadingAudit(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/audit-logs`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.items);
      }
    } finally {
      setLoadingAudit(false);
    }
  }, [accessToken, apiBaseUrl]);

  useEffect(() => {
    fetchOrgStats();
  }, [fetchOrgStats]);

  useEffect(() => {
    if (activeTab === "users" || activeTab === "organization") {
      fetchUsers();
      fetchOrgStats();
    }
    if (activeTab === "models") fetchModels();
    if (activeTab === "audit") fetchAuditLogs();
  }, [activeTab, fetchUsers, fetchOrgStats, fetchModels, fetchAuditLogs]);

  async function handleRoleChange() {
    if (!selectedUserToChangeRole) return;
    setRoleChangeError(null);
    try {
      const res = await fetch(
        `${apiBaseUrl}/api/v1/users/${selectedUserToChangeRole.user_id}/role`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: newRoleVal }),
        },
      );
      if (res.ok) {
        setSelectedUserToChangeRole(null);
        fetchUsers();
        fetchOrgStats();
      } else {
        const err = await res.json();
        setRoleChangeError(
          err.message || err.detail || "Failed to update role",
        );
      }
    } catch {
      setRoleChangeError("Network error while updating role.");
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setInviteError(null);
    setSubmittingInvite(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/users`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          full_name: inviteName.trim(),
          role: inviteRole,
          password: invitePassword.trim() || undefined,
        }),
      });
      if (res.ok) {
        setIsInviteModalOpen(false);
        setInviteName("");
        setInviteEmail("");
        setInvitePassword("");
        setInviteRole("aml_analyst");
        fetchUsers();
        fetchOrgStats();
      } else {
        const err = await res.json();
        setInviteError(err.message || err.detail || "Failed to create user");
      }
    } catch {
      setInviteError("Network error while creating user.");
    } finally {
      setSubmittingInvite(false);
    }
  }

  async function handleConfirmAction() {
    if (!confirmModal) return;
    setConfirmLoading(true);
    try {
      if (confirmModal.type === "status") {
        const res = await fetch(
          `${apiBaseUrl}/api/v1/users/${confirmModal.user.user_id}/status`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ is_active: !confirmModal.user.is_active }),
          },
        );
        if (res.ok) {
          setConfirmModal(null);
          fetchUsers();
          fetchOrgStats();
        }
      } else if (confirmModal.type === "delete") {
        const res = await fetch(
          `${apiBaseUrl}/api/v1/users/${confirmModal.user.user_id}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        if (res.ok) {
          setConfirmModal(null);
          fetchUsers();
          fetchOrgStats();
        }
      }
    } catch {
      // Handled
    } finally {
      setConfirmLoading(false);
    }
  }

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        searchQuery === "" ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.full_name &&
          u.full_name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && u.is_active) ||
        (statusFilter === "inactive" && !u.is_active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const userColumns: Column<UserItem>[] = [
    {
      key: "email",
      label: "Staff Member",
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="border-border flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-slate-100 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {(u.full_name || u.email).slice(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-text-primary text-xs font-semibold">
              {u.full_name || "—"}
            </span>
            <span className="text-text-secondary font-mono text-[11px]">
              {u.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      label: "Platform Role",
      render: (u) => {
        let badgeStyle =
          "bg-slate-100 text-slate-700 border-border dark:bg-slate-800 dark:text-slate-300";
        let label = "Staff";
        if (u.role === "administrator") {
          badgeStyle =
            "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
          label = "Administrator";
        } else if (u.role === "aml_analyst") {
          badgeStyle =
            "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
          label = "AML Analyst";
        } else if (u.role === "data_operator") {
          badgeStyle =
            "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
          label = "Data Operator";
        }
        return (
          <span
            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-bold ${badgeStyle}`}
          >
            {label}
          </span>
        );
      },
    },
    {
      key: "is_active",
      label: "Status",
      render: (u) => (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            u.is_active
              ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "border border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              u.is_active ? "bg-emerald-500" : "bg-rose-500"
            }`}
          />
          {u.is_active ? "Active" : "Deactivated"}
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Joined",
      render: (u) => (
        <span className="text-text-secondary font-mono text-xs">
          {new Date(u.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (u) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedUserToChangeRole(u);
              setNewRoleVal(u.role);
              setRoleChangeError(null);
            }}
            className="text-brand-blue hover:text-brand-blueLight text-xs font-semibold hover:underline dark:text-blue-400"
          >
            Change Role
          </button>
          <span className="text-text-secondary text-xs opacity-40">•</span>
          <button
            onClick={() => setConfirmModal({ type: "status", user: u })}
            className={`text-xs font-semibold hover:underline ${
              u.is_active
                ? "text-rose-600 dark:text-rose-400"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {u.is_active ? "Deactivate" : "Activate"}
          </button>
          <span className="text-text-secondary text-xs opacity-40">•</span>
          <button
            onClick={() => setConfirmModal({ type: "delete", user: u })}
            className="text-text-secondary text-xs font-semibold hover:text-rose-600 hover:underline"
          >
            Revoke
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="border-border flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-text-primary text-2xl font-bold tracking-tight">
              Organization &amp; User Management
            </h1>
            <span className="border-border rounded-full border bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
              Admin Clearance
            </span>
          </div>
          <p className="text-text-secondary mt-1 text-xs">
            Manage your institution&apos;s staff members, role hierarchy, and
            organization-scoped governance.
          </p>
        </div>

        {orgStats && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsInviteModalOpen(true);
                setInviteError(null);
              }}
              className="bg-brand-blue hover:bg-brand-blueLight inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">
                person_add
              </span>
              <span>Invite Staff Member</span>
            </button>
          </div>
        )}
      </div>

      {/* Organization Overview Metrics */}
      {orgStats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Org Card */}
          <div className="border-border bg-surface flex flex-col justify-between rounded-[var(--radius-card)] border p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary text-xs font-medium tracking-wider uppercase">
                Organization
              </span>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-600 uppercase dark:text-emerald-400">
                {orgStats.status}
              </span>
            </div>
            <div className="mt-2">
              <h3 className="text-text-primary truncate text-base font-bold">
                {orgStats.name}
              </h3>
              <p className="text-text-secondary truncate font-mono text-[11px]">
                slug: {orgStats.slug}
              </p>
            </div>
          </div>

          {/* Administrators Card */}
          <div className="border-border bg-surface flex flex-col justify-between rounded-[var(--radius-card)] border p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary text-xs font-medium tracking-wider uppercase">
                Administrators
              </span>
              <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                Limit: 2 Max
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-text-primary font-mono text-2xl font-bold">
                {orgStats.admin_count}
              </span>
              <span className="text-text-secondary text-xs">
                / 2 Active accounts
              </span>
            </div>
          </div>

          {/* AML Analysts Card */}
          <div className="border-border bg-surface flex flex-col justify-between rounded-[var(--radius-card)] border p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary text-xs font-medium tracking-wider uppercase">
                AML Analysts
              </span>
              <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-400">
                Investigations
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-text-primary font-mono text-2xl font-bold">
                {orgStats.analyst_count}
              </span>
              <span className="text-text-secondary text-xs">Assigned</span>
            </div>
          </div>

          {/* Data Operators Card */}
          <div className="border-border bg-surface flex flex-col justify-between rounded-[var(--radius-card)] border p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary text-xs font-medium tracking-wider uppercase">
                Data Operators
              </span>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                Ingestion
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-text-primary font-mono text-2xl font-bold">
                {orgStats.operator_count}
              </span>
              <span className="text-text-secondary text-xs">Assigned</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-border flex items-center gap-2 border-b pb-1">
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
            activeTab === "users"
              ? "bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/20 border-brand-blue/20 border font-bold shadow-2xs dark:text-blue-300"
              : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">
            manage_accounts
          </span>
          <span>Staff Directory ({users.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("organization")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
            activeTab === "organization"
              ? "bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/20 border-brand-blue/20 border font-bold shadow-2xs dark:text-blue-300"
              : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">domain</span>
          <span>Organization Governance</span>
        </button>
        <button
          onClick={() => setActiveTab("models")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
            activeTab === "models"
              ? "bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/20 border-brand-blue/20 border font-bold shadow-2xs dark:text-blue-300"
              : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">
            model_training
          </span>
          <span>Model Governance &amp; Thresholds</span>
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
            activeTab === "audit"
              ? "bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/20 border-brand-blue/20 border font-bold shadow-2xs dark:text-blue-300"
              : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">
            security
          </span>
          <span>Organization Audit Trail</span>
        </button>
      </div>

      {/* Tab 1: Users */}
      {activeTab === "users" && (
        <div className="flex flex-col gap-4">
          {/* Filters Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex max-w-md flex-1 items-center gap-2">
              <input
                type="text"
                placeholder="Search staff by name or email…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-border bg-surface text-text-primary focus:border-brand-blue focus:ring-brand-blue/20 w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="border-border bg-surface text-text-primary cursor-pointer rounded-lg border px-3 py-2 text-xs outline-none"
              >
                <option value="all">All Roles</option>
                <option value="administrator">Administrators</option>
                <option value="aml_analyst">AML Analysts</option>
                <option value="data_operator">Data Operators</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border-border bg-surface text-text-primary cursor-pointer rounded-lg border px-3 py-2 text-xs outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Deactivated</option>
              </select>
            </div>
          </div>

          <DataTable
            columns={userColumns}
            items={filteredUsers}
            total={filteredUsers.length}
            page={1}
            pageSize={50}
            onPageChange={() => {}}
            isLoading={loadingUsers}
          />
        </div>
      )}

      {/* Tab 2: Organization Governance */}
      {activeTab === "organization" &&
        (loadingOrg && !orgStats ? (
          <div className="border-border bg-surface text-text-muted rounded-[var(--radius-card)] border p-8 text-center text-sm">
            Loading organization governance...
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="border-border bg-surface rounded-[var(--radius-card)] border p-6 shadow-sm">
              <h3 className="text-text-primary mb-4 text-base font-bold">
                Organization Scope &amp; Hierarchy
              </h3>
              <div className="grid grid-cols-1 gap-4 text-xs md:grid-cols-2">
                <div className="bg-surface-hover border-border flex flex-col gap-1 rounded-lg border p-3">
                  <span className="text-text-secondary font-medium">
                    Institution Name
                  </span>
                  <span className="text-text-primary text-sm font-bold">
                    {orgStats?.name}
                  </span>
                </div>
                <div className="bg-surface-hover border-border flex flex-col gap-1 rounded-lg border p-3">
                  <span className="text-text-secondary font-medium">
                    Unique Organization Slug
                  </span>
                  <span className="text-text-primary font-mono text-sm font-bold">
                    {orgStats?.slug}
                  </span>
                </div>
                <div className="bg-surface-hover border-border flex flex-col gap-1 rounded-lg border p-3">
                  <span className="text-text-secondary font-medium">
                    Data Isolation Boundary
                  </span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                    Enforced via RLS &amp; Backend Scoping (Strict Isolation)
                  </span>
                </div>
                <div className="bg-surface-hover border-border flex flex-col gap-1 rounded-lg border p-3">
                  <span className="text-text-secondary font-medium">
                    Administrator Constraint
                  </span>
                  <span className="font-semibold text-amber-700 dark:text-amber-400">
                    Max 2 active administrators enforced atomically via DB
                    row-locking
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Organization Activity */}
            <div className="border-border bg-surface rounded-[var(--radius-card)] border p-6 shadow-sm">
              <h3 className="text-text-primary mb-4 text-base font-bold">
                Recent Organization Security Events
              </h3>
              {orgStats?.recent_activity?.length ? (
                <div className="divide-border flex flex-col divide-y">
                  {orgStats.recent_activity.map((act) => (
                    <div
                      key={act.audit_id}
                      className="flex items-center justify-between py-2.5 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-brand-blue text-[16px]">
                          verified_user
                        </span>
                        <div className="flex flex-col">
                          <span className="text-text-primary font-mono font-semibold">
                            {act.action}
                          </span>
                          <span className="text-text-secondary text-[11px]">
                            Actor: {act.user_email || "System"} • Entity:{" "}
                            {act.entity_type || "—"}
                          </span>
                        </div>
                      </div>
                      <span className="text-text-secondary font-mono text-[11px]">
                        {act.created_at
                          ? new Date(act.created_at).toLocaleString()
                          : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-secondary text-xs">
                  No recent activity recorded.
                </p>
              )}
            </div>
          </div>
        ))}

      {/* Tab 3: Models & Thresholds */}
      {activeTab === "models" && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {loadingModels ? (
            <div className="border-border bg-surface text-text-secondary animate-pulse rounded-lg border p-6">
              Loading models &amp; governance metadata…
            </div>
          ) : models.length === 0 ? (
            <div className="border-border bg-surface text-text-secondary rounded-lg border p-6">
              No active models registered in metadata table.
            </div>
          ) : (
            models.map((m) => (
              <div
                key={m.model_version}
                className="border-border bg-surface flex flex-col gap-3 rounded-[var(--radius-card)] border p-5 shadow-sm"
              >
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-text-primary font-mono font-bold">
                    {m.model_version}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    {m.algorithm}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-text-secondary block">
                      Precision Score
                    </span>
                    <span className="font-mono text-sm font-semibold">
                      {m.precision_score ?? "1.000"}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-secondary block">
                      Recall Score
                    </span>
                    <span className="font-mono text-sm font-semibold">
                      {m.recall_score ?? "1.000"}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-secondary block">F1 Score</span>
                    <span className="font-mono text-sm font-semibold">
                      {m.f1_score ?? "1.000"}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-secondary block">
                      PR-AUC / ROC-AUC
                    </span>
                    <span className="font-mono text-sm font-semibold">
                      {m.pr_auc ?? "1.00"} / {m.roc_auc ?? "1.00"}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-secondary block">
                      Low Risk Threshold
                    </span>
                    <span className="font-mono text-sm font-semibold">
                      &le; {m.threshold_low_max}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-secondary block">
                      Medium Risk Threshold
                    </span>
                    <span className="font-mono text-sm font-semibold">
                      &le; {m.threshold_medium_max}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 4: System Audit Trail */}
      {activeTab === "audit" && (
        <div className="border-border bg-surface overflow-x-auto rounded-[var(--radius-card)] border shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-border text-text-secondary border-b text-xs">
                <th className="px-4 py-2.5">Timestamp</th>
                <th className="px-4 py-2.5">User</th>
                <th className="px-4 py-2.5">Action</th>
                <th className="px-4 py-2.5">Entity Type</th>
              </tr>
            </thead>
            <tbody>
              {loadingAudit ? (
                <tr>
                  <td
                    colSpan={4}
                    className="text-caption text-text-secondary animate-pulse py-8 text-center"
                  >
                    Loading audit trail…
                  </td>
                </tr>
              ) : auditLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="text-caption text-text-secondary py-8 text-center"
                  >
                    No audit records logged yet for this organization.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr
                    key={log.audit_id}
                    className="border-border hover:bg-bg border-b last:border-0"
                  >
                    <td className="text-text-secondary px-4 py-2.5 font-mono text-xs">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="text-text-primary px-4 py-2.5 font-medium">
                      {log.user_email || "System"}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-accent font-mono text-xs">
                        {log.action}
                      </span>
                    </td>
                    <td className="text-text-secondary px-4 py-2.5 capitalize">
                      {log.entity_type || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite / Create User Modal */}
      {isInviteModalOpen && (
        <div className="animate-fade-slide-up fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="border-border bg-surface flex w-full max-w-md flex-col gap-4 rounded-2xl border p-6 shadow-2xl">
            <div className="border-border flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-brand-blue text-[20px]">
                  person_add
                </span>
                <h3 className="text-text-primary text-base font-bold">
                  Add / Invite Staff Member
                </h3>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-text-secondary hover:text-text-primary text-xs"
              >
                ✕
              </button>
            </div>

            {inviteError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-400">
                {inviteError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-text-secondary text-xs font-semibold">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Jordan Lee"
                  className="border-border bg-surface text-text-primary focus:border-brand-blue rounded-lg border px-3 py-2 text-xs outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-text-secondary text-xs font-semibold">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="jordan@apexbank.com"
                  className="border-border bg-surface text-text-primary focus:border-brand-blue rounded-lg border px-3 py-2 text-xs outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-text-secondary text-xs font-semibold">
                  Role Assignment
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="border-border bg-surface text-text-primary focus:border-brand-blue cursor-pointer rounded-lg border px-3 py-2 text-xs outline-none"
                >
                  <option value="aml_analyst">
                    AML Analyst (Alerts, Investigations, Risk Profiling)
                  </option>
                  <option value="data_operator">
                    Data Operator (Transaction CSV Ingestion &amp; Settlement)
                  </option>
                  <option value="administrator">
                    Administrator (Max 2 per organization)
                  </option>
                </select>
                {inviteRole === "administrator" &&
                  orgStats &&
                  orgStats.admin_count >= 2 && (
                    <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
                      ⚠️ Organization currently has 2 active administrators. You
                      cannot add a third.
                    </p>
                  )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-text-secondary text-xs font-semibold">
                  Initial Password (Optional)
                </label>
                <input
                  type="password"
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                  placeholder="Leave empty for auto-generated password"
                  className="border-border bg-surface text-text-primary focus:border-brand-blue rounded-lg border px-3 py-2 text-xs outline-none"
                />
              </div>

              <div className="border-border mt-2 flex justify-end gap-2.5 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="border-border text-text-secondary rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInvite}
                  className="bg-brand-blue hover:bg-brand-blueLight rounded-lg px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-all active:scale-95 disabled:opacity-60"
                >
                  {submittingInvite ? "Creating…" : "Add Staff Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      {selectedUserToChangeRole && (
        <div className="animate-fade-slide-up fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="border-border bg-surface flex w-full max-w-sm flex-col gap-4 rounded-2xl border p-6 shadow-2xl">
            <div className="border-border flex items-center gap-2 border-b pb-3">
              <span className="material-symbols-outlined text-brand-navy dark:text-brand-gold text-[20px]">
                manage_accounts
              </span>
              <h3 className="text-text-primary text-base font-bold">
                Update Staff RBAC Role
              </h3>
            </div>

            {roleChangeError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs font-medium text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-400">
                {roleChangeError}
              </div>
            )}

            <p className="text-text-secondary text-xs">
              Modify clearance level for{" "}
              <span className="text-text-primary font-semibold">
                {selectedUserToChangeRole.email}
              </span>
              .
            </p>
            <select
              value={newRoleVal}
              onChange={(e) => setNewRoleVal(e.target.value)}
              className="border-border bg-surface text-text-primary focus:border-brand-blue focus:ring-brand-blue/20 cursor-pointer rounded-lg border p-2.5 text-xs font-medium outline-none focus:ring-2"
            >
              <option value="administrator">Administrator (Max 2 limit)</option>
              <option value="aml_analyst">
                AML Analyst (Alerts &amp; SAR Filing)
              </option>
              <option value="data_operator">
                Data Operator (Data Ingestion Only)
              </option>
            </select>
            <div className="border-border flex justify-end gap-2.5 border-t pt-3">
              <button
                onClick={() => setSelectedUserToChangeRole(null)}
                className="border-border text-text-secondary rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleChange}
                className="bg-brand-blue hover:bg-brand-blueLight rounded-lg px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-all active:scale-95"
              >
                Apply Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmModal && (
        <div className="animate-fade-slide-up fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="border-border bg-surface flex w-full max-w-sm flex-col gap-4 rounded-2xl border p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-600">
              <span className="material-symbols-outlined text-[24px]">
                warning
              </span>
              <h3 className="text-text-primary text-base font-bold">
                {confirmModal.type === "status"
                  ? confirmModal.user.is_active
                    ? "Deactivate Account"
                    : "Activate Account"
                  : "Revoke Access"}
              </h3>
            </div>
            <p className="text-text-secondary text-xs leading-relaxed">
              {confirmModal.type === "status" ? (
                confirmModal.user.is_active ? (
                  <>
                    Are you sure you want to deactivate{" "}
                    <span className="text-text-primary font-semibold">
                      {confirmModal.user.email}
                    </span>
                    ? They will immediately lose access to all organization
                    workflows.
                  </>
                ) : (
                  <>
                    Reactivate account for{" "}
                    <span className="text-text-primary font-semibold">
                      {confirmModal.user.email}
                    </span>
                    ? They will regain access according to their role.
                  </>
                )
              ) : (
                <>
                  Are you sure you want to revoke access and delete{" "}
                  <span className="text-text-primary font-semibold">
                    {confirmModal.user.email}
                  </span>
                  ? This action is recorded in the immutable audit log.
                </>
              )}
            </p>
            <div className="border-border flex justify-end gap-2.5 border-t pt-3">
              <button
                onClick={() => setConfirmModal(null)}
                disabled={confirmLoading}
                className="border-border text-text-secondary rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={confirmLoading}
                className={`rounded-lg px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-all active:scale-95 ${
                  confirmModal.type === "status" && !confirmModal.user.is_active
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "bg-rose-600 hover:bg-rose-500"
                }`}
              >
                {confirmLoading ? "Processing…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
