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
          className="text-xs text-brand-blue hover:text-brand-blueLight dark:text-blue-400 font-semibold inline-flex items-center gap-1 hover:underline"
        >
          Investigate
          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </Link>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Alert Triage Queue
            </h1>
            <span className="bg-brand-blue/10 text-brand-blue dark:text-blue-300 border border-brand-blue/20 rounded-full px-2.5 py-0.5 text-[11px] font-bold">
              {total} Total Alerts
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Prioritize and investigate flagged suspicious transactions and customer behavioral anomalies.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="border border-border bg-surface flex flex-wrap items-center justify-between gap-3 rounded-xl p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            <span>Filters:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="border border-border bg-surface text-text-primary rounded-lg px-3 py-1.5 text-xs font-medium outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 cursor-pointer"
          >
            <option value="">All Lifecycle Statuses</option>
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
            className="border border-border bg-surface text-text-primary rounded-lg px-3 py-1.5 text-xs font-medium outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 cursor-pointer"
          >
            <option value="">All Risk Tiers</option>
            <option value="high">High Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="low">Low Risk</option>
          </select>
        </div>

        {(statusFilter || riskFilter) && (
          <button
            type="button"
            onClick={() => {
              setStatusFilter("");
              setRiskFilter("");
              setPage(1);
            }}
            className="text-xs text-text-secondary hover:text-text-primary underline cursor-pointer"
          >
            Clear filters
          </button>
        )}
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
