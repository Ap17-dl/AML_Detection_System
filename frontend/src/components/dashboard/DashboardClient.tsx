"use client";

import { useState, useEffect, useCallback } from "react";
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
  has_uploaded_batches?: boolean;
  is_demo_user?: boolean;
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

  // Ingestion state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showAdditionalUploadModal, setShowAdditionalUploadModal] =
    useState(false);

  const loadSummary = useCallback(async () => {
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
  }, [accessToken, apiBaseUrl]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // Handle uploading user-provided batch CSV
  async function handleUploadBatch(fileToUpload?: File) {
    const file = fileToUpload || selectedFile;
    if (!file) {
      setUploadError("Please select a valid CSV batch file to upload.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        `${apiBaseUrl}/api/v1/transactions/initial-batch`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        },
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData?.error?.message ||
            errData?.detail ||
            "Failed to ingest transaction batch.",
        );
      }

      const report = await res.json();
      setUploadSuccess(
        `Batch successfully ingested: ${report.accepted_rows} transactions accepted, ${report.rejected_rows} rejected. Surveillance rails are now active.`,
      );
      setSelectedFile(null);
      setShowAdditionalUploadModal(false);
      // Refresh summary to activate live dashboard
      await loadSummary();
    } catch (err: unknown) {
      setUploadError(
        err instanceof Error ? err.message : "Error uploading batch file.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  // Handle loading sample batch
  async function handleLoadSampleBatch(
    sampleType: "standard" | "suspicious" = "standard",
  ) {
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const res = await fetch(
        `${apiBaseUrl}/api/v1/transactions/load-sample?sample_type=${sampleType}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData?.error?.message ||
            errData?.detail ||
            "Failed to load sample dataset.",
        );
      }

      const report = await res.json();
      setUploadSuccess(
        `Sample dataset '${sampleType}' ingested: ${report.accepted_rows} transactions processed, regulatory alerts generated.`,
      );
      setShowAdditionalUploadModal(false);
      await loadSummary();
    } catch (err: unknown) {
      setUploadError(
        err instanceof Error ? err.message : "Error loading sample dataset.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface border-border h-32 animate-pulse rounded-xl border"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="bg-surface border-border h-72 animate-pulse rounded-xl border" />
          <div className="bg-surface border-border h-72 animate-pulse rounded-xl border" />
        </div>
      </div>
    );
  }

  const isNewProfile = summary && summary.has_uploaded_batches === false;

  // Render New Profile Onboarding & Batch Upload Workspace if user has no batches
  if (isNewProfile) {
    return (
      <div className="flex flex-col gap-6">
        {/* Top Header */}
        <div className="border-border flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-text-primary text-2xl font-bold tracking-tight">
                Institutional Workspace Setup
              </h1>
              <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-blue-700 uppercase dark:text-blue-400">
                Initial Ingestion Required
              </span>
            </div>
            <p className="text-text-secondary mt-1 text-xs">
              Configure your institution&apos;s transaction rails by uploading
              an initial batch CSV to initialize automated ML scoring &amp;
              graph surveillance.
            </p>
          </div>
        </div>

        {/* Status Alerts */}
        {uploadSuccess && (
          <div className="animate-fade-slide-up flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-50/80 p-4 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <span className="material-symbols-outlined text-[20px]">
              check_circle
            </span>
            <span>{uploadSuccess}</span>
          </div>
        )}

        {uploadError && (
          <div className="animate-fade-slide-up flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-50/80 p-4 text-xs font-semibold text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
            <span className="material-symbols-outlined text-[20px]">error</span>
            <span>{uploadError}</span>
          </div>
        )}

        {/* Primary Ingestion Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Drag & Drop Ingestion Workspace */}
          <div className="border-border bg-surface flex flex-col justify-between rounded-xl border p-6 shadow-xs lg:col-span-7">
            <div>
              <div className="border-border mb-4 flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="border-brand-blue/20 bg-brand-blue/10 text-brand-blue flex h-9 w-9 items-center justify-center rounded-lg border">
                    <span className="material-symbols-outlined text-[20px]">
                      upload_file
                    </span>
                  </div>
                  <div>
                    <h2 className="text-text-primary text-sm font-bold">
                      Upload Required Batch CSV
                    </h2>
                    <p className="text-text-secondary text-[11px]">
                      Upload transactions to activate ML scoring and graph
                      indicators for your profile.
                    </p>
                  </div>
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  const files = e.dataTransfer.files;
                  if (files && files.length > 0) {
                    if (files[0].name.toLowerCase().endsWith(".csv")) {
                      setSelectedFile(files[0]);
                      setUploadError(null);
                    } else {
                      setUploadError("Only .csv files are supported.");
                    }
                  }
                }}
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all ${
                  isDragOver
                    ? "border-brand-blue bg-brand-blue/5 scale-[0.99]"
                    : "border-border bg-surface-hover/40 hover:bg-surface-hover/80"
                }`}
              >
                <div className="border-border bg-surface mb-3 flex h-12 w-12 items-center justify-center rounded-full border shadow-2xs">
                  <span className="material-symbols-outlined text-brand-blue text-[26px]">
                    cloud_upload
                  </span>
                </div>

                <p className="text-text-primary text-sm font-bold">
                  {selectedFile
                    ? selectedFile.name
                    : "Drag & drop institutional CSV batch here"}
                </p>
                <p className="text-text-secondary mt-1 text-xs">
                  {selectedFile
                    ? `${(selectedFile.size / 1024).toFixed(1)} KB • Ready for validation and ingestion`
                    : "Accepts standard CSV with headers (origin, dest, amount, occurred_at)"}
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  <label className="bg-brand-blue hover:bg-brand-blueLight cursor-pointer rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all active:scale-95">
                    Browse Local File
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedFile(file);
                          setUploadError(null);
                        }
                      }}
                    />
                  </label>

                  {selectedFile && (
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="border-border text-text-secondary hover:bg-surface rounded-lg border px-3 py-2 text-xs font-medium transition-colors"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-border mt-5 flex items-center justify-between border-t pt-4">
                <button
                  type="button"
                  onClick={() => handleUploadBatch()}
                  disabled={!selectedFile || isUploading}
                  className="bg-brand-blue hover:bg-brand-blueLight inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isUploading && (
                    <span className="material-symbols-outlined animate-spin text-[16px]">
                      progress_activity
                    </span>
                  )}
                  <span>
                    {isUploading
                      ? "Ingesting & Scoring..."
                      : "Ingest Batch & Initialize Surveillance"}
                  </span>
                </button>

                <span className="text-text-muted text-[11px]">
                  Batch processing takes ~1-3s
                </span>
              </div>
            </div>

            {/* Quick-Start Alternative */}
            <div className="border-border mt-6 rounded-lg border bg-slate-50/70 p-4 dark:bg-slate-900/40">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-text-primary text-xs font-bold">
                    Need Sample Banking Data to Test?
                  </h3>
                  <p className="text-text-secondary mt-0.5 text-[11px] leading-relaxed">
                    Instantly load the pre-configured Tier-1 clearing batch into
                    your personal profile with 1 click.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleLoadSampleBatch("standard")}
                  disabled={isUploading}
                  className="border-brand-blue/30 bg-surface text-brand-blue hover:bg-brand-blue/10 shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50"
                >
                  Quick Load Test Batch
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Required Schema & Sample Downloads */}
          <div className="flex flex-col gap-6 lg:col-span-5">
            {/* Required Schema Specification Card */}
            <div className="border-border bg-surface rounded-xl border p-5 shadow-xs">
              <div className="border-border mb-3 flex items-center gap-2 border-b pb-2.5">
                <span className="material-symbols-outlined text-brand-blue text-[18px]">
                  schema
                </span>
                <h3 className="text-text-primary text-xs font-bold tracking-wider uppercase">
                  Required Batch Schema
                </h3>
              </div>
              <p className="text-text-secondary text-xs leading-relaxed">
                Your batch CSV file must contain the following columns in the
                first row:
              </p>

              <div className="mt-3 space-y-2">
                <div className="border-border bg-surface-hover/50 flex items-center justify-between rounded-md border px-3 py-1.5 font-mono text-xs">
                  <span className="text-text-primary font-bold">
                    origin_account
                  </span>
                  <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                    Required
                  </span>
                </div>
                <div className="border-border bg-surface-hover/50 flex items-center justify-between rounded-md border px-3 py-1.5 font-mono text-xs">
                  <span className="text-text-primary font-bold">
                    destination_account
                  </span>
                  <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                    Required
                  </span>
                </div>
                <div className="border-border bg-surface-hover/50 flex items-center justify-between rounded-md border px-3 py-1.5 font-mono text-xs">
                  <span className="text-text-primary font-bold">amount</span>
                  <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                    Decimal &gt; 0
                  </span>
                </div>
                <div className="border-border bg-surface-hover/50 flex items-center justify-between rounded-md border px-3 py-1.5 font-mono text-xs">
                  <span className="text-text-primary font-bold">
                    occurred_at
                  </span>
                  <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                    ISO-8601 Date
                  </span>
                </div>
                <div className="border-border bg-surface-hover/30 flex items-center justify-between rounded-md border px-3 py-1.5 font-mono text-xs opacity-80">
                  <span className="text-text-secondary">
                    channel, currency, type
                  </span>
                  <span className="text-text-muted rounded bg-slate-500/10 px-1.5 py-0.5 text-[10px] font-semibold">
                    Optional
                  </span>
                </div>
              </div>
            </div>

            {/* Official Sample Batch Templates Download */}
            <div className="border-border bg-surface rounded-xl border p-5 shadow-xs">
              <div className="border-border mb-3 flex items-center gap-2 border-b pb-2.5">
                <span className="material-symbols-outlined text-brand-gold text-[18px]">
                  download_for_offline
                </span>
                <h3 className="text-text-primary text-xs font-bold tracking-wider uppercase">
                  Download Sample CSV Templates
                </h3>
              </div>
              <p className="text-text-secondary mb-3 text-xs leading-relaxed">
                Download verified sample batches formatted specifically for the
                Sentinel schema:
              </p>

              <div className="flex flex-col gap-2">
                <a
                  href="/sample_data/transactions_standard_batch.csv"
                  download="transactions_standard_batch.csv"
                  className="border-border hover:bg-surface-hover flex items-center justify-between rounded-lg border p-2.5 text-xs transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-emerald-600">
                      description
                    </span>
                    <div>
                      <span className="text-text-primary block font-semibold">
                        Standard Clearing Batch (.csv)
                      </span>
                      <span className="text-text-muted text-[10px]">
                        Clean baseline clearing transactions (7.5 KB)
                      </span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-text-secondary text-[16px]">
                    file_download
                  </span>
                </a>

                <a
                  href="/sample_data/transactions_aml_suspicious.csv"
                  download="transactions_aml_suspicious.csv"
                  className="border-border hover:bg-surface-hover flex items-center justify-between rounded-lg border p-2.5 text-xs transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-rose-600">
                      warning
                    </span>
                    <div>
                      <span className="text-text-primary block font-semibold">
                        Suspicious AML Patterns Batch (.csv)
                      </span>
                      <span className="text-text-muted text-[10px]">
                        Structuring, layering &amp; smurfing patterns (1.8 KB)
                      </span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-text-secondary text-[16px]">
                    file_download
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active / Pre-loaded Live Surveillance Dashboard
  const riskData = [
    {
      name: "High Risk",
      value: summary?.alerts_by_risk.high || 0,
      color: "#dc2626",
    },
    {
      name: "Medium Risk",
      value: summary?.alerts_by_risk.medium || 0,
      color: "#d97706",
    },
    {
      name: "Low Risk",
      value: summary?.alerts_by_risk.low || 0,
      color: "#059669",
    },
  ];

  const statusData = [
    {
      name: "Open",
      value: summary?.alerts_by_status.open || 0,
      color: "#2563eb",
    },
    {
      name: "In Progress",
      value: summary?.alerts_by_status.in_progress || 0,
      color: "#d97706",
    },
    {
      name: "Closed",
      value: summary?.alerts_by_status.closed || 0,
      color: "#059669",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Welcome & Quick Actions */}
      <div className="border-border flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-text-primary text-2xl font-bold tracking-tight">
              Surveillance Operations
            </h1>
            {summary?.is_demo_user ? (
              <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-blue-700 uppercase dark:text-blue-400">
                Demo Persona (Pre-loaded Structure)
              </span>
            ) : (
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
                Active Production Rails
              </span>
            )}
          </div>
          <p className="text-text-secondary mt-1 text-xs">
            Real-time AML graph surveillance, alert triage velocity, and anomaly
            scoring.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowAdditionalUploadModal(true)}
            className="border-border bg-surface text-text-primary hover:bg-surface-hover flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold shadow-xs transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">
              upload_file
            </span>
            <span>Ingest Batch CSV</span>
          </button>

          {role !== "data_operator" && (
            <Link
              href="/alerts"
              className="bg-brand-blue hover:bg-brand-blueLight flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all active:scale-[0.98]"
            >
              <span>Alerts Queue</span>
              <span className="material-symbols-outlined text-[16px]">
                arrow_forward
              </span>
            </Link>
          )}
        </div>
      </div>

      {/* Upload Additional Batch Modal */}
      {showAdditionalUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="border-border bg-surface w-full max-w-lg rounded-2xl border p-6 shadow-2xl">
            <div className="border-border flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-brand-blue text-[20px]">
                  upload_file
                </span>
                <h3 className="text-text-primary text-base font-bold">
                  Ingest Additional Batch CSV
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAdditionalUploadModal(false);
                  setSelectedFile(null);
                  setUploadError(null);
                }}
                className="text-text-secondary hover:text-text-primary text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              <label className="border-border bg-surface-hover/30 hover:bg-surface-hover/60 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors">
                <span className="material-symbols-outlined text-brand-blue mb-2 text-3xl">
                  cloud_upload
                </span>
                <span className="text-text-primary text-xs font-bold">
                  {selectedFile
                    ? selectedFile.name
                    : "Select or Drop CSV Batch"}
                </span>
                <span className="text-text-muted mt-1 text-[11px]">
                  {selectedFile
                    ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                    : "Must have origin, dest, amount, occurred_at"}
                </span>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setSelectedFile(file);
                  }}
                />
              </label>

              {uploadError && (
                <p className="mt-2 text-xs font-semibold text-rose-600">
                  {uploadError}
                </p>
              )}

              <div className="mt-5 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdditionalUploadModal(false);
                    setSelectedFile(null);
                    setUploadError(null);
                  }}
                  className="border-border text-text-secondary hover:bg-surface-hover rounded-lg border px-4 py-2 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleUploadBatch()}
                  disabled={!selectedFile || isUploading}
                  className="bg-brand-blue hover:bg-brand-blueLight rounded-lg px-5 py-2 text-xs font-bold text-white shadow-xs disabled:opacity-50"
                >
                  {isUploading ? "Ingesting..." : "Ingest Batch"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards with Subtle Top Accent Lines */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Open Alerts */}
        <div className="border-border bg-surface relative overflow-hidden rounded-xl border p-5 shadow-xs transition-all hover:shadow-md">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-amber-500/80" />
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-xs font-semibold tracking-wider uppercase">
              Active Alerts
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400">
              <span className="material-symbols-outlined text-[18px]">
                notifications_active
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-text-primary font-mono text-3xl font-extrabold tracking-tight">
              {summary?.open_alerts_count ?? 0}
            </span>
            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
              Triage Queue
            </span>
          </div>
          <p className="text-text-secondary mt-2 text-[11px]">
            Pending investigator review
          </p>
        </div>

        {/* Card 2: High-Risk Transactions */}
        <div className="border-border bg-surface relative overflow-hidden rounded-xl border p-5 shadow-xs transition-all hover:shadow-md">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-rose-500/80" />
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-xs font-semibold tracking-wider uppercase">
              High-Risk Txns
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400">
              <span className="material-symbols-outlined text-[18px]">
                warning
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-text-primary font-mono text-3xl font-extrabold tracking-tight">
              {summary?.high_risk_txns_count ?? 0}
            </span>
            <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:text-rose-300">
              ML Score &gt; 0.85
            </span>
          </div>
          <p className="text-text-secondary mt-2 text-[11px]">
            Layering &amp; smurfing patterns
          </p>
        </div>

        {/* Card 3: Total Ingested Volume */}
        <div className="border-border bg-surface relative overflow-hidden rounded-xl border p-5 shadow-xs transition-all hover:shadow-md">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-blue-500/80" />
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-xs font-semibold tracking-wider uppercase">
              Ingested Volume
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400">
              <span className="material-symbols-outlined text-[18px]">
                swap_horiz
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-text-primary font-mono text-3xl font-extrabold tracking-tight">
              {summary?.total_transactions_count.toLocaleString() ?? 0}
            </span>
            <span className="text-text-secondary text-[11px] font-medium">
              Transactions
            </span>
          </div>
          <p className="text-text-secondary mt-2 text-[11px]">
            Processed across feeds
          </p>
        </div>

        {/* Card 4: Model Precision / FPR */}
        <div className="border-border bg-surface relative overflow-hidden rounded-xl border p-5 shadow-xs transition-all hover:shadow-md">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-emerald-500/80" />
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-xs font-semibold tracking-wider uppercase">
              False Positive Rate
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              <span className="material-symbols-outlined text-[18px]">
                verified
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-mono text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
              {summary
                ? `${(summary.false_positive_rate * 100).toFixed(1)}%`
                : "0%"}
            </span>
            <span className="text-text-secondary text-[11px] font-medium">
              Target: &lt; 5.0%
            </span>
          </div>
          <p className="text-text-secondary mt-2 text-[11px]">
            Regulatory precision benchmark
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="border-border bg-surface rounded-xl border p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-text-primary text-sm font-bold tracking-tight">
              Alerts Distribution by Severity
            </h2>
            <span className="text-text-secondary text-xs">Dynamic Triage</span>
          </div>
          <DistributionChart data={riskData} />
        </div>

        <div className="border-border bg-surface rounded-xl border p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-text-primary text-sm font-bold tracking-tight">
              Case Investigation Pipeline
            </h2>
            <span className="text-text-secondary text-xs">
              Analyst Workflow
            </span>
          </div>
          <DistributionChart data={statusData} />
        </div>
      </div>

      {/* Recent Alerts Feed Table */}
      {role !== "data_operator" && (
        <div className="border-border bg-surface overflow-hidden rounded-xl border shadow-xs">
          <div className="border-border flex items-center justify-between border-b p-4">
            <div>
              <h2 className="text-text-primary text-sm font-bold">
                Recent Surveillance Alerts
              </h2>
              <p className="text-text-secondary mt-0.5 text-xs">
                Real-time queue of highest priority transactions awaiting
                adjudication.
              </p>
            </div>
            <Link
              href="/alerts"
              className="text-brand-blue hover:text-brand-blueLight flex items-center gap-1 text-xs font-semibold hover:underline dark:text-blue-400"
            >
              View Full Queue
              <span className="material-symbols-outlined text-[16px]">
                chevron_right
              </span>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-border text-text-secondary border-b bg-slate-100/70 font-semibold dark:bg-slate-800/40">
                <tr>
                  <th className="px-4 py-3">Alert ID</th>
                  <th className="px-4 py-3">Account / Entity</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Detection Time</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {!summary?.recent_alerts ||
                summary.recent_alerts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-text-secondary px-4 py-8 text-center"
                    >
                      <div className="flex flex-col items-center gap-1.5">
                        <span className="material-symbols-outlined text-[24px] text-emerald-500">
                          verified
                        </span>
                        <span>
                          No active alerts in queue. System state nominal.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  summary.recent_alerts.map((a) => (
                    <tr
                      key={a.alert_id}
                      className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <td className="text-text-secondary px-4 py-3 font-mono text-xs">
                        <span className="border-border bg-surface-hover text-text-primary rounded border px-2 py-0.5">
                          {a.alert_id.slice(0, 8)}…
                        </span>
                      </td>
                      <td className="text-text-primary px-4 py-3 text-xs font-medium">
                        {a.customer_name || "Account Activity"}
                      </td>
                      <td className="px-4 py-3">
                        <RiskBadge category={a.risk_category} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={a.status} />
                      </td>
                      <td className="text-text-secondary px-4 py-3 font-mono text-xs">
                        {new Date(a.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/alerts/${a.alert_id}`}
                          className="text-brand-blue hover:text-brand-blueLight inline-flex items-center gap-1 text-xs font-semibold hover:underline dark:text-blue-400"
                        >
                          Review
                          <span className="material-symbols-outlined text-[14px]">
                            arrow_forward
                          </span>
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
