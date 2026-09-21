"use client";

import { useState, useEffect } from "react";

interface ComplianceSummary {
  total_alerts: number;
  closed_alerts: number;
  confirmed_suspicious: number;
  false_positives: number;
  resolution_rate: number;
  sar_filing_eligibility_count: number;
}

interface ReportsClientProps {
  accessToken: string;
  apiBaseUrl: string;
}

export default function ReportsClient({
  accessToken,
  apiBaseUrl,
}: ReportsClientProps) {
  const [summary, setSummary] = useState<ComplianceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    async function loadSummary() {
      setLoading(true);
      try {
        const res = await fetch(`${apiBaseUrl}/api/v1/reports/summary`, {
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

  async function handleExport(type: "alerts" | "transactions") {
    setExporting(type);
    try {
      const res = await fetch(
        `${apiBaseUrl}/api/v1/reports/export?report_type=${type}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `aml_${type}_export.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } finally {
      setExporting(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-surface border-border h-32 animate-pulse rounded-lg border" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Compliance & Audit Reports
            </h1>
            <span className="bg-brand-gold/15 text-amber-800 dark:text-amber-300 border border-brand-gold/30 rounded-full px-2.5 py-0.5 text-[11px] font-bold">
              FinCEN Regulatory
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Generate regulatory audit trails, export SAR-eligible cases, and track investigation resolution metrics.
          </p>
        </div>
      </div>

      {/* Compliance Metrics Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="relative overflow-hidden border border-border bg-surface rounded-xl p-5 shadow-xs transition-all hover:shadow-md">
          <div className="absolute inset-x-0 top-0 h-1 bg-rose-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              SAR Filing Eligibility
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-mono text-3xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400">
              {summary?.sar_filing_eligibility_count ?? 0}
            </span>
            <span className="text-xs font-semibold rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-rose-700 dark:text-rose-300">
              Confirmed Suspicious
            </span>
          </div>
          <p className="mt-2 text-[11px] text-text-secondary">Ready for regulatory dossier export</p>
        </div>

        <div className="relative overflow-hidden border border-border bg-surface rounded-xl p-5 shadow-xs transition-all hover:shadow-md">
          <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Alert Resolution Rate
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <span className="material-symbols-outlined text-[18px]">task_alt</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-mono text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
              {summary
                ? `${(summary.resolution_rate * 100).toFixed(1)}%`
                : "0%"}
            </span>
            <span className="text-xs text-text-secondary font-mono">
              ({summary?.closed_alerts ?? 0} / {summary?.total_alerts ?? 0})
            </span>
          </div>
          <p className="mt-2 text-[11px] text-text-secondary">Concluded investigations</p>
        </div>

        <div className="relative overflow-hidden border border-border bg-surface rounded-xl p-5 shadow-xs transition-all hover:shadow-md">
          <div className="absolute inset-x-0 top-0 h-1 bg-brand-blue" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              False Positives Cleared
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40 text-brand-blue dark:text-blue-400">
              <span className="material-symbols-outlined text-[18px]">remove_done</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-text-primary font-mono text-3xl font-extrabold tracking-tight">
              {summary?.false_positives ?? 0}
            </span>
            <span className="text-xs font-medium text-text-secondary">
              Dismissed Anomalies
            </span>
          </div>
          <p className="mt-2 text-[11px] text-text-secondary">Fed to retraining calibration</p>
        </div>
      </div>

      {/* Export Section */}
      <div className="border border-border bg-surface flex flex-col gap-4 rounded-xl p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-navy dark:text-brand-gold text-[20px]">download</span>
            <h2 className="text-sm font-bold text-text-primary">
              Regulatory Export Downloads
            </h2>
          </div>
          <span className="text-[11px] text-text-secondary font-mono">ENCRYPTED CSV REGISTERS</span>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="border border-border bg-slate-50/70 dark:bg-slate-900/50 flex flex-col justify-between gap-4 rounded-xl p-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-brand-blue text-[18px]">notifications_active</span>
                <h3 className="text-sm font-bold text-text-primary">
                  Alert Triage & Outcomes Register
                </h3>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed mt-1">
                Comprehensive CSV register containing all triggered alerts, risk tier categories, disposition notes, and investigator signoff timestamps.
              </p>
            </div>
            <button
              onClick={() => handleExport("alerts")}
              disabled={exporting === "alerts"}
              className="bg-brand-navy hover:bg-brand-blue text-white self-start rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition-all duration-150 inline-flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">file_download</span>
              <span>
                {exporting === "alerts"
                  ? "Generating CSV…"
                  : "Download Alerts Register CSV"}
              </span>
            </button>
          </div>

          <div className="border border-border bg-slate-50/70 dark:bg-slate-900/50 flex flex-col justify-between gap-4 rounded-xl p-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-brand-blue text-[18px]">receipt_long</span>
                <h3 className="text-sm font-bold text-text-primary">
                  Transactions Audit Registry
                </h3>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed mt-1">
                Full ledger export of analyzed transactions, clearing channels, transaction volumes, ML scoring flags, and graph indicators.
              </p>
            </div>
            <button
              onClick={() => handleExport("transactions")}
              disabled={exporting === "transactions"}
              className="bg-brand-navy hover:bg-brand-blue text-white self-start rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition-all duration-150 inline-flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">file_download</span>
              <span>
                {exporting === "transactions"
                  ? "Generating CSV…"
                  : "Download Transactions Registry CSV"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
