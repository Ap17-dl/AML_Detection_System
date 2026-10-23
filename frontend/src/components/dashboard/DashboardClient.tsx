"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { DistributionChart } from "@/components/ui/DistributionChart";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { StatusPill } from "@/components/ui/StatusPill";
import type { AlertItem } from "@/components/alerts/AlertsClient";
import type { IngestionBatchItem, BatchListResponse } from "@/types/data";

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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Batch Side Drawer & File Management state
  const [isBatchDrawerOpen, setIsBatchDrawerOpen] = useState(false);
  const [batches, setBatches] = useState<IngestionBatchItem[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<IngestionBatchItem | null>(
    null,
  );
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);
  const [drawerUploadSuccess, setDrawerUploadSuccess] = useState<string | null>(
    null,
  );
  const [drawerUploadError, setDrawerUploadError] = useState<string | null>(
    null,
  );

  const handleFilesSelected = (files: FileList | File[]) => {
    const newCsvs = Array.from(files).filter((f) =>
      f.name.toLowerCase().endsWith(".csv"),
    );
    if (newCsvs.length === 0) {
      setUploadError("Only .csv files are supported.");
      setDrawerUploadError("Only .csv files are supported.");
      return;
    }
    setSelectedFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      const uniqueNew = newCsvs.filter((f) => !existingNames.has(f.name));
      const combined = [...prev, ...uniqueNew];
      if (combined.length > 3) {
        const msg = "Maximum 3 CSV files allowed at once. First 3 files kept.";
        setUploadError(msg);
        setDrawerUploadError(msg);
        return combined.slice(0, 3);
      }
      setUploadError(null);
      setDrawerUploadError(null);
      return combined;
    });
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const loadBatches = useCallback(async () => {
    setLoadingBatches(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/transactions/batches`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data: BatchListResponse = await res.json();
        setBatches(data.items || []);
      }
    } catch (err) {
      console.error("Failed to fetch batches:", err);
    } finally {
      setLoadingBatches(false);
    }
  }, [accessToken, apiBaseUrl]);

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
    loadBatches();
  }, [loadSummary, loadBatches]);

  // Handle uploading user-provided batch CSVs (up to 3 files)
  async function handleUploadBatch(filesToUpload?: File[]) {
    const files =
      filesToUpload && filesToUpload.length > 0 ? filesToUpload : selectedFiles;
    if (!files || files.length === 0) {
      setUploadError(
        "Please select at least one valid CSV batch file to upload.",
      );
      setDrawerUploadError(
        "Please select at least one valid CSV batch file to upload.",
      );
      return;
    }

    if (files.length > 3) {
      setUploadError("You can upload a maximum of 3 files at once.");
      setDrawerUploadError("You can upload a maximum of 3 files at once.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    setDrawerUploadError(null);
    setDrawerUploadSuccess(null);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

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
      const count = report.total_files || files.length;
      const msg =
        count > 1
          ? `Successfully ingested ${count} batches: ${report.accepted_rows} transactions accepted, ${report.rejected_rows} rejected. Surveillance rails are now active.`
          : `Batch successfully ingested: ${report.accepted_rows} transactions accepted, ${report.rejected_rows} rejected. Surveillance rails are now active.`;
      setUploadSuccess(msg);
      setDrawerUploadSuccess(msg);
      setSelectedFiles([]);
      // Refresh summary & batches to activate live dashboard
      await loadBatches();
      await loadSummary();
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error ? err.message : "Error uploading batch file.";
      const friendlyMsg =
        errMsg === "Failed to fetch"
          ? `Failed to connect to backend server at ${apiBaseUrl}. Please verify the backend service is running.`
          : errMsg;
      setUploadError(friendlyMsg);
      setDrawerUploadError(friendlyMsg);
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
    setDrawerUploadError(null);
    setDrawerUploadSuccess(null);

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
      const msg = `Sample dataset '${sampleType}' ingested: ${report.accepted_rows} transactions processed, regulatory alerts generated.`;
      setUploadSuccess(msg);
      setDrawerUploadSuccess(msg);
      await loadBatches();
      await loadSummary();
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error ? err.message : "Error loading sample dataset.";
      const friendlyMsg =
        errMsg === "Failed to fetch"
          ? `Failed to connect to backend server at ${apiBaseUrl}. Please verify the backend service is running.`
          : errMsg;
      setUploadError(friendlyMsg);
      setDrawerUploadError(friendlyMsg);
    } finally {
      setIsUploading(false);
    }
  }

  // Handle removing / deleting an uploaded batch
  async function handleDeleteBatch(batchId: string) {
    setIsDeletingBatch(true);
    setDrawerUploadError(null);
    setDrawerUploadSuccess(null);
    try {
      const res = await fetch(
        `${apiBaseUrl}/api/v1/transactions/batches/${batchId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData?.error?.message || "Failed to remove batch file.",
        );
      }
      setDrawerUploadSuccess(
        "Batch file and all linked transactions, predictions, and alerts were purged.",
      );
      setBatchToDelete(null);
      await loadBatches();
      await loadSummary();
    } catch (err: unknown) {
      setDrawerUploadError(
        err instanceof Error ? err.message : "Error deleting batch file.",
      );
    } finally {
      setIsDeletingBatch(false);
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
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleFilesSelected(e.dataTransfer.files);
                  }
                }}
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all ${
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
                  {selectedFiles.length > 0
                    ? `${selectedFiles.length} of 3 file${selectedFiles.length > 1 ? "s" : ""} selected`
                    : "Drag & drop up to 3 CSV batch files at once"}
                </p>
                <p className="text-text-secondary mt-1 text-xs">
                  {selectedFiles.length > 0
                    ? "Review your files below or click browse to add more"
                    : "Accepts up to 3 institutional CSVs with headers (origin, dest, amount, occurred_at)"}
                </p>

                {/* Selected Files List Chips */}
                {selectedFiles.length > 0 && (
                  <div className="mt-4 flex w-full max-w-lg flex-col gap-2">
                    {selectedFiles.map((file, idx) => (
                      <div
                        key={`${file.name}-${idx}`}
                        className="border-border bg-surface flex items-center justify-between rounded-lg border px-3 py-2 text-left shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <span className="material-symbols-outlined text-brand-blue shrink-0 text-[18px]">
                            description
                          </span>
                          <div className="min-w-0">
                            <p className="text-text-primary truncate text-xs font-semibold">
                              {file.name}
                            </p>
                            <p className="text-text-secondary text-[10px]">
                              {(file.size / 1024).toFixed(1)} KB • Batch #
                              {idx + 1}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile(idx);
                          }}
                          className="hover:bg-surface-hover text-text-muted rounded p-1 text-xs transition-colors hover:text-rose-500"
                          title="Remove this file"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  {selectedFiles.length < 3 && (
                    <label className="bg-brand-blue hover:bg-brand-blueLight cursor-pointer rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all active:scale-95">
                      {selectedFiles.length === 0
                        ? "Browse CSV Files (Max 3)"
                        : `Add File (${3 - selectedFiles.length} remaining)`}
                      <input
                        type="file"
                        accept=".csv"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handleFilesSelected(e.target.files);
                            e.target.value = "";
                          }
                        }}
                      />
                    </label>
                  )}

                  {selectedFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedFiles([])}
                      className="border-border text-text-secondary hover:bg-surface rounded-lg border px-3 py-2 text-xs font-medium transition-colors"
                    >
                      Clear All ({selectedFiles.length})
                    </button>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-border mt-5 flex items-center justify-between border-t pt-4">
                <button
                  type="button"
                  onClick={() => handleUploadBatch()}
                  disabled={selectedFiles.length === 0 || isUploading}
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
                      : selectedFiles.length > 1
                        ? `Ingest ${selectedFiles.length} Batches & Initialize Surveillance`
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
            onClick={() => {
              setIsBatchDrawerOpen(true);
              loadBatches();
            }}
            className="border-border bg-surface text-text-primary hover:bg-surface-hover hover:border-brand-blue flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold shadow-xs transition-all"
          >
            <span className="material-symbols-outlined text-brand-blue text-[16px]">
              folder_open
            </span>
            <span>Batch Files</span>
            {batches.length > 0 && (
              <span className="bg-brand-blue/10 text-brand-blue rounded-full px-2 py-0.5 text-[10px] font-bold">
                {batches.length}
              </span>
            )}
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

      {/* Floating "Go To Side" Button on Right Viewport Edge */}
      <button
        type="button"
        onClick={() => {
          setIsBatchDrawerOpen(true);
          loadBatches();
        }}
        className="border-brand-blue/40 bg-surface/95 text-text-primary hover:bg-brand-blue group fixed top-1/2 right-0 z-40 flex -translate-y-1/2 items-center gap-2 rounded-l-xl border-y border-l px-3 py-3 text-xs font-bold shadow-2xl backdrop-blur-md transition-all hover:text-white"
        title="View Uploaded Batch Files, Details, Remove or Ingest new files"
      >
        <span className="material-symbols-outlined text-brand-blue text-[20px] group-hover:text-white">
          folder_open
        </span>
        <span className="hidden font-semibold sm:inline">Uploaded Files</span>
        {batches.length > 0 && (
          <span className="bg-brand-blue group-hover:text-brand-blue rounded-full px-2 py-0.5 text-[10px] font-bold text-white group-hover:bg-white">
            {batches.length}
          </span>
        )}
      </button>

      {/* Slide-over Side Drawer for Uploaded Batch Files */}
      {isBatchDrawerOpen && (
        <div className="animate-fade-slide-up fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs transition-opacity">
          <div
            className="fixed inset-0"
            onClick={() => setIsBatchDrawerOpen(false)}
          />
          <div className="border-border bg-surface relative z-10 flex h-full w-full max-w-xl flex-col border-l shadow-2xl">
            {/* Drawer Header */}
            <div className="border-border flex items-center justify-between border-b p-5">
              <div className="flex items-center gap-3">
                <div className="border-brand-blue/30 bg-brand-blue/10 text-brand-blue flex h-10 w-10 items-center justify-center rounded-xl border">
                  <span className="material-symbols-outlined text-[22px]">
                    folder_open
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-text-primary text-base font-bold">
                      Batch Files &amp; Datasets
                    </h2>
                    <span className="bg-brand-blue/10 text-brand-blue rounded-full px-2 py-0.5 text-[10px] font-bold">
                      {batches.length} {batches.length === 1 ? "file" : "files"}
                    </span>
                  </div>
                  <p className="text-text-secondary text-xs">
                    Inspect uploaded batches, remove files, or upload new
                    transaction batches.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBatchDrawerOpen(false)}
                className="text-text-secondary hover:text-text-primary hover:bg-surface-hover flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            {/* Drawer Feedback Alerts */}
            {drawerUploadSuccess && (
              <div className="m-4 mb-0 flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-50/80 p-3 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">
                    check_circle
                  </span>
                  <span>{drawerUploadSuccess}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerUploadSuccess(null)}
                  className="text-emerald-700 dark:text-emerald-400"
                >
                  ✕
                </button>
              </div>
            )}
            {drawerUploadError && (
              <div className="m-4 mb-0 flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-50/80 p-3 text-xs font-semibold text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">
                    error
                  </span>
                  <span>{drawerUploadError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerUploadError(null)}
                  className="text-rose-700 dark:text-rose-400"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Drawer Scrollable Content */}
            <div className="flex-1 space-y-6 overflow-y-auto p-5">
              {/* Option to Upload New Files */}
              <div className="border-border bg-surface-hover/30 rounded-xl border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-text-primary flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
                    <span className="material-symbols-outlined text-brand-blue text-[16px]">
                      upload_file
                    </span>
                    Upload CSV Files (Up to 3)
                  </span>
                  <span className="text-text-secondary text-[11px]">
                    {selectedFiles.length}/3 selected
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {selectedFiles.length < 3 && (
                    <label className="border-border bg-surface hover:bg-surface-hover flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 text-center transition-colors">
                      <span className="material-symbols-outlined text-brand-blue mb-1 text-2xl">
                        cloud_upload
                      </span>
                      <span className="text-text-primary text-xs font-semibold">
                        {selectedFiles.length === 0
                          ? "Choose up to 3 CSVs or drag & drop"
                          : `Add more (${3 - selectedFiles.length} remaining)`}
                      </span>
                      <span className="text-text-secondary mt-0.5 text-[10px]">
                        Origin, destination, amount, timestamp columns
                      </span>
                      <input
                        type="file"
                        accept=".csv"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handleFilesSelected(e.target.files);
                            e.target.value = "";
                          }
                        }}
                      />
                    </label>
                  )}

                  {/* Selected Files List Chips in Drawer */}
                  {selectedFiles.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      {selectedFiles.map((f, idx) => (
                        <div
                          key={`${f.name}-${idx}`}
                          className="border-border bg-surface flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs shadow-2xs"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="material-symbols-outlined text-brand-blue shrink-0 text-[16px]">
                              description
                            </span>
                            <span className="text-text-primary truncate text-[11px] font-medium">
                              {f.name}
                            </span>
                            <span className="text-text-muted shrink-0 text-[10px]">
                              ({(f.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(idx)}
                            className="hover:bg-surface-hover text-text-muted rounded p-1 text-[11px] transition-colors hover:text-rose-500"
                            title="Remove file"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={selectedFiles.length === 0 || isUploading}
                      onClick={async () => {
                        await handleUploadBatch();
                      }}
                      className="bg-brand-blue hover:bg-brand-blueLight flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-white shadow-xs transition-all disabled:opacity-50"
                    >
                      {isUploading ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-[16px]">
                            progress_activity
                          </span>
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[16px]">
                            file_upload
                          </span>
                          <span>
                            {selectedFiles.length > 1
                              ? `Upload ${selectedFiles.length} Batches at once`
                              : "Upload Batch"}
                          </span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={async () => {
                        await handleLoadSampleBatch("standard");
                      }}
                      className="border-border bg-surface hover:bg-surface-hover text-text-primary rounded-lg border px-3 py-2 text-xs font-medium transition-colors"
                      title="Quick load standard sample batch"
                    >
                      + Standard
                    </button>

                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={async () => {
                        await handleLoadSampleBatch("suspicious");
                      }}
                      className="border-border bg-surface hover:bg-surface-hover rounded-lg border px-3 py-2 text-xs font-medium text-rose-600 transition-colors dark:text-rose-400"
                      title="Quick load suspicious sample batch"
                    >
                      + Suspicious
                    </button>
                  </div>
                </div>
              </div>

              {/* Uploaded Files Section */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-text-primary flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
                    <span className="material-symbols-outlined text-text-secondary text-[16px]">
                      dataset
                    </span>
                    Uploaded Files ({batches.length})
                  </h3>
                  <button
                    type="button"
                    onClick={loadBatches}
                    className="text-text-secondary hover:text-text-primary flex items-center gap-1 text-[11px]"
                  >
                    <span
                      className={`material-symbols-outlined text-[14px] ${loadingBatches ? "animate-spin" : ""}`}
                    >
                      refresh
                    </span>
                    Refresh
                  </button>
                </div>

                {loadingBatches ? (
                  <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div
                        key={i}
                        className="border-border bg-surface h-24 animate-pulse rounded-xl border"
                      />
                    ))}
                  </div>
                ) : batches.length === 0 ? (
                  <div className="border-border bg-surface rounded-xl border p-8 text-center">
                    <span className="material-symbols-outlined text-text-secondary mb-2 text-3xl">
                      inventory_2
                    </span>
                    <p className="text-text-primary text-xs font-semibold">
                      No batch files uploaded
                    </p>
                    <p className="text-text-secondary mt-1 text-[11px]">
                      Upload your first CSV file above to populate transaction
                      surveillance.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {batches.map((b) => (
                      <div
                        key={b.batch_id}
                        className="border-border bg-surface hover:border-border/80 flex flex-col justify-between rounded-xl border p-4 shadow-xs transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="border-border bg-surface-hover flex h-9 w-9 items-center justify-center rounded-lg border">
                              <span className="material-symbols-outlined text-brand-blue text-[20px]">
                                description
                              </span>
                            </div>
                            <div>
                              <h4 className="text-text-primary text-xs font-bold">
                                {b.filename || "transaction_batch.csv"}
                              </h4>
                              <p className="text-text-secondary text-[11px]">
                                {new Date(b.started_at).toLocaleString([], {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              b.status === "completed"
                                ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : b.status === "failed"
                                  ? "border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                  : "border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {b.status}
                          </span>
                        </div>

                        {/* Metric stats */}
                        <div className="border-border/60 bg-surface-hover/40 mt-3 grid grid-cols-3 gap-2 rounded-lg border p-2 text-center text-[11px]">
                          <div>
                            <span className="text-text-secondary block text-[10px]">
                              Total
                            </span>
                            <span className="text-text-primary font-bold">
                              {b.total_rows}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-emerald-600 dark:text-emerald-400">
                              Accepted
                            </span>
                            <span className="text-text-primary font-bold">
                              {b.accepted_rows}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-rose-600 dark:text-rose-400">
                              Rejected
                            </span>
                            <span className="text-text-primary font-bold">
                              {b.rejected_rows}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="border-border/60 mt-3 flex items-center justify-between border-t pt-2.5">
                          <span className="text-text-muted font-mono text-[10px]">
                            ID: {b.batch_id.slice(0, 8)}…
                          </span>
                          <button
                            type="button"
                            onClick={() => setBatchToDelete(b)}
                            className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              delete_outline
                            </span>
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal to Remove Batch */}
      {batchToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="border-border bg-surface animate-fade-slide-up w-full max-w-md rounded-2xl border p-6 shadow-2xl">
            <div className="mb-3 flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2.5">
                <span className="material-symbols-outlined text-[24px]">
                  warning
                </span>
              </div>
              <div>
                <h3 className="text-text-primary text-base font-bold">
                  Remove Batch File
                </h3>
                <p className="text-text-secondary text-xs">
                  Purge transactions &amp; surveillance records
                </p>
              </div>
            </div>

            <p className="text-text-secondary text-xs leading-relaxed">
              Are you sure you want to remove{" "}
              <strong className="text-text-primary font-semibold">
                {batchToDelete.filename || "this batch"}
              </strong>
              ? All {batchToDelete.accepted_rows} transactions, predictions, and
              alerts generated from this batch will be permanently deleted from
              the database.
            </p>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeletingBatch}
                onClick={() => setBatchToDelete(null)}
                className="border-border text-text-secondary hover:bg-surface-hover rounded-lg border px-4 py-2 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingBatch}
                onClick={() => handleDeleteBatch(batchToDelete.batch_id)}
                className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-rose-700 disabled:opacity-50"
              >
                {isDeletingBatch ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[16px]">
                      progress_activity
                    </span>
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">
                      delete
                    </span>
                    <span>Yes, Remove Batch</span>
                  </>
                )}
              </button>
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
