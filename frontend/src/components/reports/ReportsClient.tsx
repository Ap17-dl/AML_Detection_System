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
      const res = await fetch(`${apiBaseUrl}/api/v1/reports/export?report_type=${type}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
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
        <div className="h-32 bg-surface rounded-lg border border-border animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-page-title text-text-primary">Compliance & Audit Reports</h1>
        <p className="text-body text-text-secondary">
          Generate regulatory audit trails, export SAR-eligible cases, and track resolution metrics.
        </p>
      </div>

      {/* Compliance Metrics Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="border-border bg-surface rounded-[var(--radius-card)] border p-5 shadow-sm">
          <span className="text-caption text-text-secondary">SAR Filing Eligibility</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-bold font-mono text-red-500">
              {summary?.sar_filing_eligibility_count ?? 0}
            </span>
            <span className="text-xs text-text-secondary">Confirmed Suspicious</span>
          </div>
        </div>

        <div className="border-border bg-surface rounded-[var(--radius-card)] border p-5 shadow-sm">
          <span className="text-caption text-text-secondary">Alert Resolution Rate</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-bold font-mono text-emerald-500">
              {summary ? `${(summary.resolution_rate * 100).toFixed(1)}%` : "0%"}
            </span>
            <span className="text-xs text-text-secondary">
              ({summary?.closed_alerts} / {summary?.total_alerts} closed)
            </span>
          </div>
        </div>

        <div className="border-border bg-surface rounded-[var(--radius-card)] border p-5 shadow-sm">
          <span className="text-caption text-text-secondary">False Positives Ruled</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-bold font-mono text-text-primary">
              {summary?.false_positives ?? 0}
            </span>
            <span className="text-xs text-text-secondary">Cleared Cases</span>
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="border-border bg-surface rounded-[var(--radius-card)] border p-6 shadow-sm flex flex-col gap-4">
        <h2 className="text-section-title text-text-primary border-b pb-2">
          Regulatory Export Downloads
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-bg p-4 flex flex-col justify-between gap-4">
            <div>
              <h3 className="font-semibold text-text-primary">Alert Triage & Outcomes Register</h3>
              <p className="text-caption text-text-secondary mt-1">
                CSV register containing all triggered alerts, risk categories, disposition labels, and investigator closure timestamps.
              </p>
            </div>
            <button
              onClick={() => handleExport("alerts")}
              disabled={exporting === "alerts"}
              className="self-start rounded-md bg-accent px-4 py-2 text-sm font-medium text-surface shadow-sm hover:bg-accent/90 disabled:opacity-50 transition-colors"
            >
              {exporting === "alerts" ? "Generating CSV…" : "Download Alerts CSV →"}
            </button>
          </div>

          <div className="rounded-lg border border-border bg-bg p-4 flex flex-col justify-between gap-4">
            <div>
              <h3 className="font-semibold text-text-primary">Transactions Audit Registry</h3>
              <p className="text-caption text-text-secondary mt-1">
                Full ledger export of analyzed transactions, channels, amounts, and associated detection metadata.
              </p>
            </div>
            <button
              onClick={() => handleExport("transactions")}
              disabled={exporting === "transactions"}
              className="self-start rounded-md bg-accent px-4 py-2 text-sm font-medium text-surface shadow-sm hover:bg-accent/90 disabled:opacity-50 transition-colors"
            >
              {exporting === "transactions" ? "Generating CSV…" : "Download Transactions CSV →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
