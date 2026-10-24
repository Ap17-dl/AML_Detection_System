"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

import type { IngestionReport } from "@/types/data";

interface ImportClientProps {
  accessToken: string;
  apiBaseUrl: string;
}

type BatchCategory = "standard" | "suspicious";

interface BannerConfig {
  id: BatchCategory;
  title: string;
  expectedFilename: string;
  downloadUrl: string;
  fileSizeLabel: string;
  badge: string;
  badgeColor: string;
  icon: string;
  description: string;
}

const BANNERS: BannerConfig[] = [
  {
    id: "standard",
    title: "Standard Batch Report",
    expectedFilename: "transactions_standard_batch.csv",
    downloadUrl: "/sample_data/transactions_standard_batch.csv",
    fileSizeLabel: "7.5 KB",
    badge: "Clearing Baseline",
    badgeColor:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    icon: "description",
    description:
      "Everyday retail, commercial, and interbank transactions without intentional anomaly markers. Used to establish normal account activity baselines.",
  },
  {
    id: "suspicious",
    title: "Suspicious Transactions Report",
    expectedFilename: "transactions_aml_suspicious.csv",
    downloadUrl: "/sample_data/transactions_aml_suspicious.csv",
    fileSizeLabel: "1.8 KB",
    badge: "AML High-Risk",
    badgeColor:
      "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    icon: "warning",
    description:
      "Curated transactions exhibiting AML typologies (structuring under $10,000 threshold, circular flow loops, rapid fund velocity, and high-risk jurisdictions).",
  },
];

export default function ImportClient({
  accessToken,
  apiBaseUrl,
}: ImportClientProps) {
  // Separate file queues for each banner: allow 1 or more files
  const [standardFiles, setStandardFiles] = useState<File[]>([]);
  const [suspiciousFiles, setSuspiciousFiles] = useState<File[]>([]);

  // Drag states per banner
  const [draggingStandard, setDraggingStandard] = useState(false);
  const [draggingSuspicious, setDraggingSuspicious] = useState(false);

  // Upload status
  const [uploadingCategory, setUploadingCategory] =
    useState<BatchCategory | null>(null);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<{
    category: BatchCategory;
    data: IngestionReport;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addFilesToCategory = useCallback(
    (category: BatchCategory, newFiles: FileList | File[]) => {
      const validCsvs: File[] = [];
      let hasInvalid = false;

      for (let i = 0; i < newFiles.length; i++) {
        const f = newFiles[i];
        if (f.name.toLowerCase().endsWith(".csv")) {
          validCsvs.push(f);
        } else {
          hasInvalid = true;
        }
      }

      if (hasInvalid) {
        setError("Only .csv files are accepted. Non-CSV files were skipped.");
      } else {
        setError(null);
      }

      if (category === "standard") {
        setStandardFiles((prev) => {
          const existingNames = new Set(prev.map((f) => f.name));
          const uniqueNew = validCsvs.filter((f) => !existingNames.has(f.name));
          return [...prev, ...uniqueNew];
        });
      } else {
        setSuspiciousFiles((prev) => {
          const existingNames = new Set(prev.map((f) => f.name));
          const uniqueNew = validCsvs.filter((f) => !existingNames.has(f.name));
          return [...prev, ...uniqueNew];
        });
      }
    },
    [],
  );

  const removeFile = useCallback(
    (category: BatchCategory, filename: string) => {
      if (category === "standard") {
        setStandardFiles((prev) => prev.filter((f) => f.name !== filename));
      } else {
        setSuspiciousFiles((prev) => prev.filter((f) => f.name !== filename));
      }
    },
    [],
  );

  const handleUpload = async (category: BatchCategory) => {
    const filesToUpload =
      category === "standard" ? standardFiles : suspiciousFiles;
    if (filesToUpload.length === 0) return;

    setUploadingCategory(category);
    setProgress(20);
    setError(null);

    try {
      const formData = new FormData();
      filesToUpload.forEach((f) => {
        formData.append("files", f);
      });
      // Also append first file as 'file' for single-file fallback
      if (filesToUpload.length > 0) {
        formData.append("file", filesToUpload[0]);
      }

      setProgress(50);
      const res = await fetch(`${apiBaseUrl}/api/v1/transactions/import`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });

      setProgress(90);

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          body?.error?.message ?? `Upload failed (${res.status})`,
        );
      }

      const result: IngestionReport = await res.json();
      setReport({ category, data: result });
      setProgress(100);

      // Clear that banner's files upon success
      if (category === "standard") {
        setStandardFiles([]);
      } else {
        setSuspiciousFiles([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploadingCategory(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="border-border flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-blue text-2xl">
              upload_file
            </span>
            <h1 className="text-text-primary text-2xl font-bold tracking-tight">
              Transaction Batch Import
            </h1>
          </div>
          <p className="text-text-secondary mt-1 text-xs">
            Import batches under the 2 designated formats: Standard Batch Report
            or Suspicious Transactions. Add 1 or more files to either queue.
          </p>
        </div>
        <Link
          href="/transactions"
          className="text-text-secondary hover:text-brand-navy inline-flex items-center gap-1.5 text-xs font-semibold transition-colors dark:hover:text-white"
        >
          <span className="material-symbols-outlined text-[16px]">
            arrow_back
          </span>
          <span>Return to Transactions</span>
        </Link>
      </div>

      {/* Global Error message */}
      {error && (
        <div className="bg-risk-high/10 border-risk-high/30 text-risk-high flex items-center justify-between rounded-xl border p-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-text-muted hover:text-text-primary text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Progress bar */}
      {uploadingCategory && (
        <div className="border-border bg-surface rounded-xl border p-5 shadow-sm">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-text-primary font-semibold">
              Uploading &amp; scoring{" "}
              {uploadingCategory === "standard"
                ? "Standard Batch Report"
                : "Suspicious Transactions"}
              …
            </span>
            <span className="text-text-secondary font-mono">{progress}%</span>
          </div>
          <div className="bg-border h-2 overflow-hidden rounded-full">
            <div
              className="bg-brand-blue h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Ingestion Report View */}
      {report && (
        <div className="space-y-4">
          <div className="border-border bg-surface rounded-xl border p-6 shadow-sm">
            <div className="border-border mb-4 flex flex-wrap items-center justify-between gap-2 border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-emerald-600">
                  check_circle
                </span>
                <h2 className="text-text-primary text-lg font-bold">
                  Ingestion Report:{" "}
                  {report.category === "standard"
                    ? "Standard Batch Report"
                    : "Suspicious Transactions"}
                </h2>
              </div>
              <span className="text-text-secondary font-mono text-xs">
                Batch ID: {report.data.batch_id}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="bg-surface-hover rounded-lg p-3 text-center">
                <p className="text-text-secondary text-[11px] font-semibold uppercase">
                  Files Processed
                </p>
                <p className="text-text-primary mt-1 text-xl font-bold">
                  {report.data.total_files ?? 1}
                </p>
              </div>
              <div className="bg-surface-hover rounded-lg p-3 text-center">
                <p className="text-text-secondary text-[11px] font-semibold uppercase">
                  Total Rows
                </p>
                <p className="text-text-primary mt-1 text-xl font-bold">
                  {report.data.total_rows}
                </p>
              </div>
              <div className="rounded-lg bg-emerald-500/10 p-3 text-center">
                <p className="text-[11px] font-semibold text-emerald-700 uppercase dark:text-emerald-400">
                  Accepted
                </p>
                <p className="mt-1 text-xl font-bold text-emerald-700 dark:text-emerald-400">
                  {report.data.accepted_rows}
                </p>
              </div>
              <div className="rounded-lg bg-rose-500/10 p-3 text-center">
                <p className="text-[11px] font-semibold text-rose-700 uppercase dark:text-rose-400">
                  Rejected
                </p>
                <p className="mt-1 text-xl font-bold text-rose-700 dark:text-rose-400">
                  {report.data.rejected_rows}
                </p>
              </div>
            </div>

            {/* Sub-batches breakdown if multiple files */}
            {report.data.batches && report.data.batches.length > 1 && (
              <div className="border-border mt-5 border-t pt-4">
                <h4 className="text-text-primary mb-2 text-xs font-bold">
                  Individual File Breakdown
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-border text-text-secondary border-b">
                        <th className="px-3 py-2">File Name</th>
                        <th className="px-3 py-2">Total Rows</th>
                        <th className="px-3 py-2">Accepted</th>
                        <th className="px-3 py-2">Rejected</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.data.batches.map((b, idx) => (
                        <tr
                          key={idx}
                          className="border-border border-b last:border-b-0"
                        >
                          <td className="px-3 py-2 font-mono font-medium">
                            {b.filename ?? `file-${idx + 1}.csv`}
                          </td>
                          <td className="px-3 py-2">{b.total_rows}</td>
                          <td className="px-3 py-2 font-semibold text-emerald-600">
                            {b.accepted_rows}
                          </td>
                          <td className="px-3 py-2 font-semibold text-rose-600">
                            {b.rejected_rows}
                          </td>
                          <td className="px-3 py-2 capitalize">{b.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Validation Errors */}
          {report.data.errors && report.data.errors.length > 0 && (
            <div className="border-border bg-surface rounded-xl border p-6 shadow-sm">
              <h3 className="text-text-primary mb-3 text-sm font-bold">
                Validation Errors ({report.data.errors.length})
              </h3>
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-border text-text-secondary border-b">
                      <th className="px-3 py-2">Row</th>
                      <th className="px-3 py-2">Field</th>
                      <th className="px-3 py-2">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.data.errors.map((err, i) => (
                      <tr
                        key={i}
                        className="border-border border-b last:border-b-0"
                      >
                        <td className="px-3 py-2 font-mono">{err.row}</td>
                        <td className="text-brand-blue px-3 py-2 font-mono font-semibold">
                          {err.field}
                        </td>
                        <td className="text-text-secondary px-3 py-2">
                          {err.message}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/transactions"
              className="bg-brand-blue hover:bg-brand-blueLight rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all"
            >
              View Transactions
            </Link>
            <Link
              href="/alerts"
              className="border-border hover:bg-surface-hover text-text-primary rounded-lg border px-4 py-2 text-xs font-semibold transition-all"
            >
              View Alerts
            </Link>
            <button
              type="button"
              onClick={() => {
                setReport(null);
                setProgress(0);
              }}
              className="border-border text-text-secondary hover:bg-surface-hover rounded-lg border px-4 py-2 text-xs font-medium transition-colors"
            >
              Upload Another Batch
            </button>
          </div>
        </div>
      )}

      {/* 2 BANNERS UPLOAD SECTION */}
      {!report && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {BANNERS.map((banner) => {
            const isStandard = banner.id === "standard";
            const files = isStandard ? standardFiles : suspiciousFiles;
            const isDragging = isStandard
              ? draggingStandard
              : draggingSuspicious;
            const setDragging = isStandard
              ? setDraggingStandard
              : setDraggingSuspicious;
            const isUploading = uploadingCategory === banner.id;

            return (
              <div
                key={banner.id}
                className="border-border bg-surface flex flex-col justify-between rounded-xl border p-5 shadow-sm transition-all"
              >
                <div>
                  {/* Banner Header */}
                  <div className="border-border flex items-start justify-between gap-2 border-b pb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                          isStandard
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-rose-500/10 text-rose-600"
                        }`}
                      >
                        <span className="material-symbols-outlined text-xl">
                          {banner.icon}
                        </span>
                      </div>
                      <div>
                        <h2 className="text-text-primary text-sm font-bold">
                          {banner.title}
                        </h2>
                        <span className="text-text-muted block font-mono text-[10px]">
                          Template: {banner.expectedFilename}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${banner.badgeColor}`}
                    >
                      {banner.badge}
                    </span>
                  </div>

                  {/* Banner Description */}
                  <p className="text-text-secondary mt-3 min-h-[48px] text-xs leading-relaxed">
                    {banner.description}
                  </p>

                  {/* Download Template Link */}
                  <div className="bg-surface-hover border-border mt-3 flex items-center justify-between rounded-lg border p-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-text-secondary text-[16px]">
                        file_download
                      </span>
                      <span className="text-text-primary text-[11px] font-semibold">
                        {banner.expectedFilename}
                      </span>
                      <span className="text-text-muted text-[10px]">
                        ({banner.fileSizeLabel})
                      </span>
                    </div>
                    <a
                      href={banner.downloadUrl}
                      download={banner.expectedFilename}
                      className="text-brand-blue inline-flex items-center gap-1 text-[11px] font-semibold hover:underline"
                    >
                      Download
                    </a>
                  </div>

                  {/* Dropzone for 1 or more files */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragging(false);
                      if (
                        e.dataTransfer.files &&
                        e.dataTransfer.files.length > 0
                      ) {
                        addFilesToCategory(banner.id, e.dataTransfer.files);
                      }
                    }}
                    className={`mt-4 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 text-center transition-all ${
                      isDragging
                        ? "border-brand-blue bg-brand-blue/5 scale-[1.01]"
                        : "border-border hover:border-border-hover bg-bg/50"
                    }`}
                  >
                    <span className="material-symbols-outlined text-text-secondary text-2xl">
                      cloud_upload
                    </span>
                    <div>
                      <p className="text-text-primary text-xs font-semibold">
                        Drag &amp; drop 1 or more CSV files here
                      </p>
                      <p className="text-text-muted mt-0.5 text-[10px]">
                        Supports multi-file upload (.csv)
                      </p>
                    </div>

                    <label className="bg-surface hover:bg-surface-hover text-text-primary border-border mt-1 cursor-pointer rounded-lg border px-3 py-1.5 text-[11px] font-semibold shadow-2xs transition-all active:scale-95">
                      Browse Files
                      <input
                        type="file"
                        accept=".csv"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            addFilesToCategory(banner.id, e.target.files);
                            e.target.value = "";
                          }
                        }}
                      />
                    </label>
                  </div>

                  {/* Staged files list */}
                  {files.length > 0 && (
                    <div className="mt-4 space-y-1.5">
                      <div className="text-text-secondary flex items-center justify-between text-[11px] font-semibold">
                        <span>Staged Files ({files.length})</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (isStandard) setStandardFiles([]);
                            else setSuspiciousFiles([]);
                          }}
                          className="text-text-muted transition-colors hover:text-rose-500"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="max-h-36 space-y-1 overflow-y-auto">
                        {files.map((f) => (
                          <div
                            key={f.name}
                            className="bg-surface-hover border-border flex items-center justify-between rounded-md border px-2.5 py-1.5 text-xs"
                          >
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              <span className="material-symbols-outlined text-text-secondary shrink-0 text-[14px]">
                                description
                              </span>
                              <span className="text-text-primary truncate font-mono text-[11px]">
                                {f.name}
                              </span>
                              <span className="text-text-muted shrink-0 text-[10px]">
                                ({(f.size / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(banner.id, f.name)}
                              className="text-text-muted ml-2 p-0.5 text-xs font-bold hover:text-rose-500"
                              title="Remove file"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Upload action for this banner */}
                <div className="border-border mt-5 border-t pt-4">
                  <button
                    type="button"
                    disabled={
                      files.length === 0 ||
                      isUploading ||
                      uploadingCategory !== null
                    }
                    onClick={() => handleUpload(banner.id)}
                    className={`flex w-full items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all duration-150 ${
                      files.length === 0 || uploadingCategory !== null
                        ? "cursor-not-allowed bg-slate-300 text-slate-500 dark:bg-slate-700"
                        : isStandard
                          ? "bg-emerald-600 hover:bg-emerald-700 active:scale-98"
                          : "bg-rose-600 hover:bg-rose-700 active:scale-98"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      upload
                    </span>
                    <span>
                      {isUploading
                        ? "Processing Ingestion…"
                        : files.length === 0
                          ? `Select ${banner.title} File(s)`
                          : `Upload & Ingest ${files.length} ${files.length === 1 ? "File" : "Files"}`}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CSV Schema Specification Guide */}
      {!report && (
        <div className="border-border bg-surface rounded-xl border p-5 shadow-xs">
          <h3 className="text-text-primary mb-2 text-xs font-bold tracking-wider uppercase">
            Standard CSV Schema Columns
          </h3>
          <p className="text-text-secondary mb-3 text-xs">
            Both the Standard Batch and Suspicious Transactions CSV files adhere
            to Sentinel&#39;s canonical clearing schema:
          </p>
          <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
            <span className="bg-surface-hover border-border rounded border px-2 py-0.5 font-semibold text-emerald-700 dark:text-emerald-400">
              origin_account (required)
            </span>
            <span className="bg-surface-hover border-border rounded border px-2 py-0.5 font-semibold text-emerald-700 dark:text-emerald-400">
              destination_account (required)
            </span>
            <span className="bg-surface-hover border-border rounded border px-2 py-0.5 font-semibold text-emerald-700 dark:text-emerald-400">
              amount (required)
            </span>
            <span className="bg-surface-hover border-border rounded border px-2 py-0.5 font-semibold text-emerald-700 dark:text-emerald-400">
              occurred_at (required)
            </span>
            <span className="bg-surface-hover border-border text-text-secondary rounded border px-2 py-0.5">
              external_ref
            </span>
            <span className="bg-surface-hover border-border text-text-secondary rounded border px-2 py-0.5">
              currency
            </span>
            <span className="bg-surface-hover border-border text-text-secondary rounded border px-2 py-0.5">
              channel
            </span>
            <span className="bg-surface-hover border-border text-text-secondary rounded border px-2 py-0.5">
              transaction_type
            </span>
            <span className="bg-surface-hover border-border text-text-secondary rounded border px-2 py-0.5">
              origin_customer_name
            </span>
            <span className="bg-surface-hover border-border text-text-secondary rounded border px-2 py-0.5">
              destination_customer_name
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
