"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

import type { IngestionReport } from "@/types/data";

/**
 * CSV Import flow — Design Scheme §4.3 (AML-FR-04/05/06).
 *
 * Drag-and-drop → upload → progress → ingestion report (accepted/rejected + errors).
 */

interface ImportClientProps {
  accessToken: string;
  apiBaseUrl: string;
}

export default function ImportClient({
  accessToken,
  apiBaseUrl,
}: ImportClientProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<IngestionReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.name.endsWith(".csv")) {
      setFile(droppedFile);
      setReport(null);
      setError(null);
    } else {
      setError("Only .csv files are accepted.");
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        setFile(selectedFile);
        setReport(null);
        setError(null);
      }
    },
    [],
  );

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setProgress(20);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

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
      setReport(result);
      setProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="border-border flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-text-primary text-2xl font-bold tracking-tight">
            Import Transactions Batch
          </h1>
          <p className="text-text-secondary mt-1 text-xs">
            Upload standardized CSV clearing batch files for ingestion and
            real-time ML scoring.
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

      {/* Drop zone */}
      {!report && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-border bg-surface flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-12 shadow-xs transition-all ${
            isDragging
              ? "border-brand-blue bg-brand-blue/5 scale-[1.01]"
              : "hover:border-brand-blue/50"
          }`}
        >
          <div className="bg-brand-blue/10 text-brand-blue ring-brand-blue/20 flex h-16 w-16 items-center justify-center rounded-2xl ring-1">
            <span className="material-symbols-outlined text-3xl">
              upload_file
            </span>
          </div>
          <div className="text-center">
            <p className="text-text-primary text-sm font-bold">
              {file ? file.name : "Drag & drop a transaction CSV file here"}
            </p>
            <p className="text-text-secondary mt-1 text-xs">
              {file
                ? `${(file.size / 1024).toFixed(1)} KB • Ready for processing`
                : "Supports schema v2.0 (origin, dest, amount, type, channel)"}
            </p>
          </div>
          {!file && (
            <label className="bg-brand-navy hover:bg-brand-blue cursor-pointer rounded-lg px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-all duration-150 active:scale-95">
              Browse Local Files
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          )}
          {file && !uploading && (
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleUpload}
                className="bg-brand-navy hover:bg-brand-blue rounded-lg px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition-all duration-150 active:scale-95"
              >
                Upload & Ingest Batch
              </button>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setError(null);
                }}
                className="border-border text-text-secondary rounded-lg border px-4 py-2 text-xs font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Progress bar */}
      {uploading && (
        <div className="border-border bg-surface rounded-[var(--radius-card)] border p-6">
          <p className="text-body text-text-primary mb-3">
            Uploading and validating…
          </p>
          <div className="bg-border h-2 overflow-hidden rounded-full">
            <div
              className="bg-accent h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-risk-high/10 border-risk-high/30 text-risk-high rounded-[var(--radius-card)] border p-4">
          <p className="text-body font-medium">Import failed</p>
          <p className="text-caption mt-1">{error}</p>
        </div>
      )}

      {/* Ingestion report */}
      {report && (
        <div className="space-y-4">
          <div className="border-border bg-surface rounded-[var(--radius-card)] border p-6 shadow-sm">
            <h2 className="text-h2 text-text-primary mb-4">Ingestion Report</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-bg rounded-md p-4 text-center">
                <p className="text-display text-text-primary">
                  {report.total_rows}
                </p>
                <p className="text-caption text-text-secondary mt-1">
                  Total Rows
                </p>
              </div>
              <div className="bg-risk-low/10 rounded-md p-4 text-center">
                <p className="text-display text-risk-low">
                  {report.accepted_rows}
                </p>
                <p className="text-caption text-text-secondary mt-1">
                  Accepted
                </p>
              </div>
              <div className="bg-risk-high/10 rounded-md p-4 text-center">
                <p className="text-display text-risk-high">
                  {report.rejected_rows}
                </p>
                <p className="text-caption text-text-secondary mt-1">
                  Rejected
                </p>
              </div>
            </div>
          </div>

          {/* Error details */}
          {report.errors.length > 0 && (
            <div className="border-border bg-surface rounded-[var(--radius-card)] border p-6 shadow-sm">
              <h3 className="text-h3 text-text-primary mb-3">
                Validation Errors ({report.errors.length})
              </h3>
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-border border-b">
                      <th className="text-label text-text-secondary px-3 py-2">
                        Row
                      </th>
                      <th className="text-label text-text-secondary px-3 py-2">
                        Field
                      </th>
                      <th className="text-label text-text-secondary px-3 py-2">
                        Error
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.errors.map((err, i) => (
                      <tr
                        key={i}
                        className="border-border border-b last:border-b-0"
                      >
                        <td className="text-caption px-3 py-2 font-mono">
                          {err.row}
                        </td>
                        <td className="text-caption text-accent px-3 py-2 font-mono">
                          {err.field}
                        </td>
                        <td className="text-caption text-text-secondary px-3 py-2">
                          {err.message}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/transactions"
              className="bg-accent hover:bg-accent/90 text-body rounded-md px-4 py-2 font-medium text-white transition-all duration-150"
            >
              View Transactions
            </Link>
            <button
              type="button"
              onClick={() => {
                setReport(null);
                setFile(null);
                setProgress(0);
              }}
              className="border-border text-body text-text-primary hover:bg-bg rounded-md border px-4 py-2 transition-colors"
            >
              Import Another
            </button>
          </div>
        </div>
      )}

      {/* CSV format guide */}
      {!report && (
        <div className="border-border bg-surface rounded-[var(--radius-card)] border p-6 shadow-sm">
          <h3 className="text-h3 text-text-primary mb-3">
            Expected CSV Format
          </h3>
          <p className="text-body text-text-secondary mb-3">
            Required columns:{" "}
            <code className="bg-bg text-accent rounded px-1.5 py-0.5 font-mono text-xs">
              origin_account
            </code>
            ,{" "}
            <code className="bg-bg text-accent rounded px-1.5 py-0.5 font-mono text-xs">
              destination_account
            </code>
            ,{" "}
            <code className="bg-bg text-accent rounded px-1.5 py-0.5 font-mono text-xs">
              amount
            </code>
            ,{" "}
            <code className="bg-bg text-accent rounded px-1.5 py-0.5 font-mono text-xs">
              occurred_at
            </code>
          </p>
          <p className="text-caption text-text-secondary">
            Optional: <code className="font-mono text-xs">external_ref</code>,{" "}
            <code className="font-mono text-xs">currency</code>,{" "}
            <code className="font-mono text-xs">transaction_type</code>,{" "}
            <code className="font-mono text-xs">channel</code>,{" "}
            <code className="font-mono text-xs">origin_customer_name</code>,{" "}
            <code className="font-mono text-xs">destination_customer_name</code>
          </p>
        </div>
      )}
    </div>
  );
}
