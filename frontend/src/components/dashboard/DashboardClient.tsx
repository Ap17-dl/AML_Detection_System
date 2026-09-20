"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DistributionChart } from "@/components/ui/DistributionChart";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { StatusPill } from "@/components/ui/StatusPill";
import type { AlertItem } from "@/components/alerts/AlertsClient";

interface DashboardSummary {
  open_alerts_count: number;
  high_risk_txns_count: number;
  total_transactions_count: number;
  customers_monitored_count: number;
  false_positive_rate: number;
  alerts_by_risk: { high: number; medium: number; low: number };
  alerts_by_status: { open: number; in_progress: number; closed: number };
  recent_alerts: AlertItem[];
}

interface DashboardClientProps {
  accessToken: string;
  apiBaseUrl: string;
  role: string;
}

export default function DashboardClient({
  accessToken,
  apiBaseUrl,
  role,
}: DashboardClientProps) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSummary() {
      setLoading(true);
      try {
        const res = await fetch(`${apiBaseUrl}/api/v1/dashboard/summary`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          setSummary(await res.json());
        }
      } finally {
        setLoading(false);
      }
    }
    loadSummary();
  }, [accessToken, apiBaseUrl]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface border-border h-28 animate-pulse rounded-lg border"
            />
          ))}
        </div>
      </div>
    );
  }

  const riskData = [
    {
      name: "High Risk",
      value: summary?.alerts_by_risk.high || 0,
      color: "#ef4444",
    },
    {
      name: "Medium Risk",
      value: summary?.alerts_by_risk.medium || 0,
      color: "#f59e0b",
    },
    {
      name: "Low Risk",
      value: summary?.alerts_by_risk.low || 0,
      color: "#10b981",
    },
  ];

  const statusData = [
    {
      name: "Open",
      value: summary?.alerts_by_status.open || 0,
      color: "#3b82f6",
    },
    {
      name: "In Progress",
      value: summary?.alerts_by_status.in_progress || 0,
      color: "#f59e0b",
    },
    {
      name: "Closed",
      value: summary?.alerts_by_status.closed || 0,
      color: "#10b981",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-page-title text-text-primary">
            Operations Dashboard
          </h1>
          <p className="text-body text-text-secondary">
            Live AML surveillance, alert triage rates, and anomaly detection
            metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {(role === "data_operator" || role === "administrator") && (
            <Link
              href="/transactions/import"
              className="border-border bg-surface text-text-primary hover:bg-bg rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"
            >
              + Import Data
            </Link>
          )}
          {role !== "data_operator" && (
            <Link
              href="/alerts"
              className="bg-accent text-surface hover:bg-accent/90 rounded-md px-4 py-1.5 text-sm font-medium transition-colors"
            >
              Open Alerts Queue →
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border-border bg-surface rounded-[var(--radius-card)] border p-5 shadow-sm">
          <span className="text-caption text-text-secondary">
            Active Open Alerts
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-text-primary font-mono text-3xl font-bold">
              {summary?.open_alerts_count ?? 0}
            </span>
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-500">
              Triage Required
            </span>
          </div>
        </div>

        <div className="border-border bg-surface rounded-[var(--radius-card)] border p-5 shadow-sm">
          <span className="text-caption text-text-secondary">
            High-Risk Transactions
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-3xl font-bold text-red-500">
              {summary?.high_risk_txns_count ?? 0}
            </span>
            <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-500">
              Flagged ML
            </span>
          </div>
        </div>

        <div className="border-border bg-surface rounded-[var(--radius-card)] border p-5 shadow-sm">
          <span className="text-caption text-text-secondary">
            Total Ingested Volume
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-text-primary font-mono text-3xl font-bold">
              {summary?.total_transactions_count.toLocaleString() ?? 0}
            </span>
            <span className="text-text-secondary text-xs">Transactions</span>
          </div>
        </div>

        <div className="border-border bg-surface rounded-[var(--radius-card)] border p-5 shadow-sm">
          <span className="text-caption text-text-secondary">
            Model Precision / FPR
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-3xl font-bold text-emerald-500">
              {summary
                ? `${(summary.false_positive_rate * 100).toFixed(1)}%`
                : "0%"}
            </span>
            <span className="text-text-secondary text-xs">Target &lt; 15%</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="border-border bg-surface flex flex-col gap-3 rounded-[var(--radius-card)] border p-5 shadow-sm">
          <h2 className="text-section-title text-text-primary">
            Alerts by Risk Tier
          </h2>
          <DistributionChart data={riskData} />
        </div>

        <div className="border-border bg-surface flex flex-col gap-3 rounded-[var(--radius-card)] border p-5 shadow-sm">
          <h2 className="text-section-title text-text-primary">
            Investigation Resolution Status
          </h2>
          <DistributionChart data={statusData} />
        </div>
      </div>

      {/* Recent Alerts Feed */}
      {role !== "data_operator" && (
        <div className="border-border bg-surface flex flex-col gap-4 rounded-[var(--radius-card)] border p-5 shadow-sm">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="text-section-title text-text-primary">
              Latest Triggered Alerts
            </h2>
            <Link
              href="/alerts"
              className="text-accent text-xs font-medium hover:underline"
            >
              View All Alerts ({summary?.open_alerts_count ?? 0}) →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-border text-text-secondary border-b text-xs">
                  <th className="px-3 py-2.5">Alert ID</th>
                  <th className="px-3 py-2.5">Customer</th>
                  <th className="px-3 py-2.5">Risk Tier</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Timestamp</th>
                  <th className="px-3 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {!summary?.recent_alerts ||
                summary.recent_alerts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-caption text-text-secondary py-8 text-center"
                    >
                      No active alerts in queue.
                    </td>
                  </tr>
                ) : (
                  summary.recent_alerts.map((a) => (
                    <tr
                      key={a.alert_id}
                      className="border-border hover:bg-bg border-b transition-colors last:border-0"
                    >
                      <td className="text-text-secondary px-3 py-2.5 font-mono text-xs">
                        {a.alert_id.slice(0, 8)}…
                      </td>
                      <td className="text-text-primary px-3 py-2.5 font-medium">
                        {a.customer_name || "Account Activity"}
                      </td>
                      <td className="px-3 py-2.5">
                        <RiskBadge category={a.risk_category} />
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusPill status={a.status} />
                      </td>
                      <td className="text-text-secondary px-3 py-2.5 font-mono text-xs">
                        {new Date(a.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <Link
                          href={`/alerts/${a.alert_id}`}
                          className="text-accent text-xs font-semibold hover:underline"
                        >
                          Review →
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
