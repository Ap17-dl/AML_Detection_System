"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { StatusPill } from "@/components/ui/StatusPill";

export interface AlertItem {
  alert_id: string;
  customer_id?: string | null;
  customer_name?: string | null;
  triggering_transaction_id?: string | null;
  transaction_amount?: number | null;
  prediction_id?: string | null;
  risk_category: string;
  status: string;
  assigned_to?: string | null;
  assigned_to_email?: string | null;
  outcome?: string | null;
  created_at: string;
  closed_at?: string | null;
}

interface AlertsClientProps {
  accessToken: string;
  apiBaseUrl: string;
}

export default function AlertsClient({
  accessToken,
  apiBaseUrl,
}: AlertsClientProps) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: "25",
      });
      if (statusFilter) params.set("status", statusFilter);
      if (riskFilter) params.set("risk_category", riskFilter);

      const res = await fetch(
        `${apiBaseUrl}/api/v1/alerts?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.items);
        setTotal(data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken, apiBaseUrl, page, statusFilter, riskFilter]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const columns: Column<AlertItem>[] = [
    {
      key: "alert_id",
      label: "Alert ID",
      render: (a) => (
        <Link
          href={`/alerts/${a.alert_id}`}
          className="text-accent font-mono text-xs hover:underline"
        >
          {a.alert_id.slice(0, 8)}…
        </Link>
      ),
    },
    {
      key: "created_at",
      label: "Triggered",
      sortable: true,
      render: (a) => (
        <span className="text-caption text-text-secondary font-mono">
          {new Date(a.created_at).toLocaleString()}
        </span>
      ),
    },
    {
      key: "customer_name",
      label: "Target Customer",
      render: (a) => (
        <span className="text-text-primary font-medium">
          {a.customer_name ||
            (a.customer_id ? a.customer_id.slice(0, 8) + "…" : "—")}
        </span>
      ),
    },
    {
      key: "risk_category",
      label: "Risk Level",
      render: (a) => <RiskBadge category={a.risk_category} />,
    },
    {
      key: "status",
      label: "Status",
      render: (a) => <StatusPill status={a.status} />,
    },
    {
      key: "outcome",
      label: "Outcome",
      render: (a) =>
        a.outcome ? (
          <StatusPill status={a.outcome} />
        ) : (
          <span className="text-text-secondary text-caption">—</span>
        ),
    },
    {
      key: "actions",
      label: "Action",
      render: (a) => (
        <Link
          href={`/alerts/${a.alert_id}`}
          className="text-caption text-accent font-medium hover:underline"
        >
          Investigate →
        </Link>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-page-title text-text-primary">
            Alert Triage Queue
          </h1>
          <p className="text-body text-text-secondary">
            Prioritize and investigate flagged suspicious transactions and
            customer behavioral anomalies.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="border-border bg-surface flex flex-wrap items-center gap-3 rounded-[var(--radius-card)] border p-4 shadow-sm">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="border-border bg-bg text-body text-text-primary rounded-md border px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={riskFilter}
          onChange={(e) => {
            setRiskFilter(e.target.value);
            setPage(1);
          }}
          className="border-border bg-bg text-body text-text-primary rounded-md border px-3 py-2 text-sm"
        >
          <option value="">All Risk Tiers</option>
          <option value="high">High Risk</option>
          <option value="medium">Medium Risk</option>
          <option value="low">Low Risk</option>
        </select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        items={alerts}
        total={total}
        page={page}
        pageSize={25}
        onPageChange={setPage}
        isLoading={loading}
        emptyMessage="No alerts matching selected filters."
      />
    </div>
  );
}
