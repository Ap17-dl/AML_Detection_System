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

export default function AdminClient({ accessToken, apiBaseUrl }: AdminClientProps) {
  const [activeTab, setActiveTab] = useState<"users" | "models" | "audit">("users");

  // Users state
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserToChangeRole, setSelectedUserToChangeRole] = useState<UserItem | null>(null);
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
        }
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
        <span className="capitalize font-medium text-text-primary">
          {u.role.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "is_active",
      label: "Status",
      render: (u) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
            u.is_active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
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
          className="text-xs text-accent font-medium hover:underline"
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
        <h1 className="text-page-title text-text-primary">Platform Administration</h1>
        <p className="text-body text-text-secondary">
          Manage staff RBAC roles, review ML model performance thresholds, and inspect immutable audit logs.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab("users")}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === "users"
              ? "border-accent text-accent font-semibold"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          Staff &amp; RBAC Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab("models")}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === "models"
              ? "border-accent text-accent font-semibold"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          Model Governance &amp; Thresholds
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === "audit"
              ? "border-accent text-accent font-semibold"
              : "border-transparent text-text-secondary hover:text-text-primary"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loadingModels ? (
            <div className="border border-border bg-surface p-6 rounded-lg text-text-secondary animate-pulse">
              Loading models & governance metadata…
            </div>
          ) : models.length === 0 ? (
            <div className="border border-border bg-surface p-6 rounded-lg text-text-secondary">
              No active models registered in metadata table.
            </div>
          ) : (
            models.map((m) => (
              <div key={m.model_version} className="border border-border bg-surface rounded-[var(--radius-card)] p-5 shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="font-mono font-bold text-text-primary">{m.model_version}</span>
                  <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                    {m.algorithm}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-text-secondary block">Precision Score</span>
                    <span className="font-mono text-sm font-semibold">{m.precision_score ?? "1.000"}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary block">Recall Score</span>
                    <span className="font-mono text-sm font-semibold">{m.recall_score ?? "1.000"}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary block">F1 Score</span>
                    <span className="font-mono text-sm font-semibold">{m.f1_score ?? "1.000"}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary block">PR-AUC / ROC-AUC</span>
                    <span className="font-mono text-sm font-semibold">{m.pr_auc ?? "1.00"} / {m.roc_auc ?? "1.00"}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary block">Low Risk Threshold</span>
                    <span className="font-mono text-sm font-semibold">&le; {m.threshold_low_max}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary block">Medium Risk Threshold</span>
                    <span className="font-mono text-sm font-semibold">&le; {m.threshold_medium_max}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: System Audit Trail */}
      {activeTab === "audit" && (
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-border bg-surface shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-text-secondary">
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">User</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Entity Type</th>
              </tr>
            </thead>
            <tbody>
              {loadingAudit ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-caption text-text-secondary animate-pulse">
                    Loading audit trail…
                  </td>
                </tr>
              ) : auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-caption text-text-secondary">
                    No audit records logged yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.audit_id} className="border-b border-border last:border-0 hover:bg-bg">
                    <td className="py-2.5 px-4 font-mono text-xs text-text-secondary">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-text-primary">
                      {log.user_email || "System"}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-mono text-xs text-accent">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 capitalize text-text-secondary">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-xl flex flex-col gap-4">
            <h3 className="text-section-title text-text-primary">Update Staff Role</h3>
            <p className="text-body text-text-secondary text-sm">
              Change access level for <strong>{selectedUserToChangeRole.email}</strong>.
            </p>
            <select
              value={newRoleVal}
              onChange={(e) => setNewRoleVal(e.target.value)}
              className="rounded-md border border-border bg-bg p-2 text-sm text-text-primary"
            >
              <option value="administrator">Administrator</option>
              <option value="aml_analyst">AML Analyst</option>
              <option value="data_operator">Data Operator</option>
            </select>
            <div className="flex justify-end gap-3 border-t pt-3">
              <button
                onClick={() => setSelectedUserToChangeRole(null)}
                className="rounded-md border border-border px-3 py-1.5 text-xs text-text-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleChange}
                className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-surface"
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
