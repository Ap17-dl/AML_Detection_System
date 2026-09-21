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
        <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface border border-border h-32 animate-pulse rounded-xl"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="bg-surface border border-border h-72 animate-pulse rounded-xl" />
          <div className="bg-surface border border-border h-72 animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  const riskData = [
    {
      name: "High Risk",
      value: summary?.alerts_by_risk.high || 0,
      color: "#f43f5e",
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Surveillance Operations
            </h1>
            <span className="bg-brand-gold/15 text-amber-800 dark:text-amber-300 border border-brand-gold/30 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider">
              Live Monitor
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Real-time AML graph surveillance, alert triage velocity, and anomaly scoring.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {(role === "data_operator" || role === "administrator") && (
            <Link
              href="/transactions/import"
              className="border border-border bg-surface text-text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg px-3.5 py-2 text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">upload_file</span>
              <span>Import Batch</span>
            </Link>
          )}
          {role !== "data_operator" && (
            <Link
              href="/alerts"
              className="bg-brand-navy hover:bg-brand-blue text-white rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition-all duration-150 flex items-center gap-1.5"
            >
              <span>Alerts Queue</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards with Colored Top Accent Lines */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Open Alerts */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-surface p-5 shadow-xs transition-all hover:shadow-md">
          <div className="absolute inset-x-0 top-0 h-1 bg-amber-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Active Alerts
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <span className="material-symbols-outlined text-[18px]">notifications_active</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-text-primary font-mono text-3xl font-extrabold tracking-tight">
              {summary?.open_alerts_count ?? 0}
            </span>
            <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
              Triage Queue
            </span>
          </div>
          <p className="mt-2 text-[11px] text-text-secondary">Pending investigator review</p>
        </div>

        {/* Card 2: High-Risk Transactions */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-surface p-5 shadow-xs transition-all hover:shadow-md">
          <div className="absolute inset-x-0 top-0 h-1 bg-rose-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              High-Risk Txns
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <span className="material-symbols-outlined text-[18px]">warning</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-mono text-3xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400">
              {summary?.high_risk_txns_count ?? 0}
            </span>
            <span className="rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:text-rose-300">
              ML Score &gt; 0.85
            </span>
          </div>
          <p className="mt-2 text-[11px] text-text-secondary">Layering & smurfing patterns</p>
        </div>

        {/* Card 3: Total Ingested Volume */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-surface p-5 shadow-xs transition-all hover:shadow-md">
          <div className="absolute inset-x-0 top-0 h-1 bg-brand-blue" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Ingested Volume
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40 text-brand-blue dark:text-blue-400">
              <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-text-primary font-mono text-3xl font-extrabold tracking-tight">
              {summary?.total_transactions_count.toLocaleString() ?? 0}
            </span>
            <span className="text-[11px] font-medium text-text-secondary">
              Transactions
            </span>
          </div>
          <p className="mt-2 text-[11px] text-text-secondary">Processed across feeds</p>
        </div>

        {/* Card 4: Model Precision / FPR */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-surface p-5 shadow-xs transition-all hover:shadow-md">
          <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              False Positive Rate
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <span className="material-symbols-outlined text-[18px]">verified</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-mono text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
              {summary
                ? `${(summary.false_positive_rate * 100).toFixed(1)}%`
                : "0%"}
            </span>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              Benchmark &lt; 15%
            </span>
          </div>
          <p className="mt-2 text-[11px] text-text-secondary">Ensemble GNN model v2.1</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="border border-border bg-surface flex flex-col gap-3 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-blue text-[20px]">pie_chart</span>
              <h2 className="text-sm font-bold text-text-primary">
                Alerts by Risk Tier
              </h2>
            </div>
            <span className="text-[11px] font-mono text-text-secondary">SEVERITY BREAKDOWN</span>
          </div>
          <DistributionChart data={riskData} />
        </div>

        <div className="border border-border bg-surface flex flex-col gap-3 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-blue text-[20px]">stacked_bar_chart</span>
              <h2 className="text-sm font-bold text-text-primary">
                Investigation Resolution Pipeline
              </h2>
            </div>
            <span className="text-[11px] font-mono text-text-secondary">LIFECYCLE STATUS</span>
          </div>
          <DistributionChart data={statusData} />
        </div>
      </div>

      {/* Recent Alerts Feed */}
      {role !== "data_operator" && (
        <div className="border border-border bg-surface flex flex-col rounded-xl shadow-xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-brand-gold text-[20px]">flag</span>
                <h2 className="text-sm font-bold text-text-primary">
                  Latest Triggered Alerts
                </h2>
              </div>
              <p className="text-[11px] text-text-secondary mt-0.5">
                Real-time queue of transactions flagged by the ensemble detector.
              </p>
            </div>
            <Link
              href="/alerts"
              className="text-brand-blue hover:text-brand-blueLight dark:text-blue-400 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <span>View All ({summary?.open_alerts_count ?? 0})</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50/80 dark:bg-slate-900/60 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  <th className="px-4 py-3">Alert ID</th>
                  <th className="px-4 py-3">Customer Entity</th>
                  <th className="px-4 py-3">Risk Tier</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {!summary?.recent_alerts ||
                summary.recent_alerts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-xs text-text-secondary py-12 text-center"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-4xl">
                          verified
                        </span>
                        <span>No active alerts in queue. System state nominal.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  summary.recent_alerts.map((a) => (
                    <tr
                      key={a.alert_id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          {a.alert_id.slice(0, 8)}…
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-text-primary text-xs">
                        {a.customer_name || "Account Activity"}
                      </td>
                      <td className="px-4 py-3">
                        <RiskBadge category={a.risk_category} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={a.status} />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                        {new Date(a.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/alerts/${a.alert_id}`}
                          className="text-brand-blue hover:text-brand-blueLight dark:text-blue-400 text-xs font-semibold inline-flex items-center gap-1 hover:underline"
                        >
                          Review
                          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
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
