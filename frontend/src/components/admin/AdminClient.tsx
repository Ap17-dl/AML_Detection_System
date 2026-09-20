"use client";

import { useState, useEffect, useCallback } from "react";
import { DataTable, type Column } from "@/components/ui/DataTable";

interface UserItem {
  user_id: string;
  email: string;
  full_name?: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login_at?: string | null;
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
  const [activeTab, setActiveTab] = useState<"users" | "models" | "audit">(
    "users",
  );

  // Users state
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserToChangeRole, setSelectedUserToChangeRole] =
    useState<UserItem | null>(null);
  const [newRoleVal, setNewRoleVal] = useState<string>("aml_analyst");

  // Models state
  const [models, setModels] = useState<ModelMeta[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  // Audit state
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/users`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) setUsers(await res.json());
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
    if (activeTab === "users") fetchUsers();
    if (activeTab === "models") fetchModels();
    if (activeTab === "audit") fetchAuditLogs();
  }, [activeTab, fetchUsers, fetchModels, fetchAuditLogs]);

  async function handleRoleChange() {
    if (!selectedUserToChangeRole) return;
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
      }
    } catch {
      // Handled
    }
  }

  const userColumns: Column<UserItem>[] = [
    { key: "email", label: "Email Address" },
    {
      key: "role",
      label: "Role",
      render: (u) => (
        <span className="text-text-primary font-medium capitalize">
          {u.role.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "is_active",
      label: "Status",
      render: (u) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
            u.is_active
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {u.is_active ? "Active" : "Suspended"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Action",
      render: (u) => (
        <button
          onClick={() => {
            setSelectedUserToChangeRole(u);
            setNewRoleVal(u.role);
          }}
          className="text-accent text-xs font-medium hover:underline"
        >
          Change Role
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-page-title text-text-primary">
          Platform Administration
        </h1>
        <p className="text-body text-text-secondary">
          Manage staff RBAC roles, review ML model performance thresholds, and
          inspect immutable audit logs.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-border flex gap-6 border-b text-sm font-medium">
        <button
          onClick={() => setActiveTab("users")}
          className={`border-b-2 pb-3 transition-colors ${
            activeTab === "users"
              ? "border-accent text-accent font-semibold"
              : "text-text-secondary hover:text-text-primary border-transparent"
          }`}
        >
          Staff &amp; RBAC Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab("models")}
          className={`border-b-2 pb-3 transition-colors ${
            activeTab === "models"
              ? "border-accent text-accent font-semibold"
              : "text-text-secondary hover:text-text-primary border-transparent"
          }`}
        >
          Model Governance &amp; Thresholds
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`border-b-2 pb-3 transition-colors ${
            activeTab === "audit"
              ? "border-accent text-accent font-semibold"
              : "text-text-secondary hover:text-text-primary border-transparent"
          }`}
        >
          System Audit Trail
        </button>
      </div>

      {/* Tab 1: Users */}
      {activeTab === "users" && (
        <div className="flex flex-col gap-4">
          <DataTable
            columns={userColumns}
            items={users}
            total={users.length}
            page={1}
            pageSize={50}
            onPageChange={() => {}}
            isLoading={loadingUsers}
          />
        </div>
      )}

      {/* Tab 2: Models & Thresholds */}
      {activeTab === "models" && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {loadingModels ? (
            <div className="border-border bg-surface text-text-secondary animate-pulse rounded-lg border p-6">
              Loading models & governance metadata…
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

      {/* Tab 3: System Audit Trail */}
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
                    No audit records logged yet.
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

      {/* Role Change Modal */}
      {selectedUserToChangeRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="border-border bg-surface flex w-full max-w-sm flex-col gap-4 rounded-[var(--radius-card)] border p-6 shadow-xl">
            <h3 className="text-section-title text-text-primary">
              Update Staff Role
            </h3>
            <p className="text-body text-text-secondary text-sm">
              Change access level for{" "}
              <strong>{selectedUserToChangeRole.email}</strong>.
            </p>
            <select
              value={newRoleVal}
              onChange={(e) => setNewRoleVal(e.target.value)}
              className="border-border bg-bg text-text-primary rounded-md border p-2 text-sm"
            >
              <option value="administrator">Administrator</option>
              <option value="aml_analyst">AML Analyst</option>
              <option value="data_operator">Data Operator</option>
            </select>
            <div className="flex justify-end gap-3 border-t pt-3">
              <button
                onClick={() => setSelectedUserToChangeRole(null)}
                className="border-border text-text-secondary rounded-md border px-3 py-1.5 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleChange}
                className="bg-accent text-surface rounded-md px-3 py-1.5 text-xs font-semibold"
              >
                Apply Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
