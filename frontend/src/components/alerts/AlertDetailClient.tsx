"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { StatusPill } from "@/components/ui/StatusPill";
import { ExplanationPanel } from "@/components/ui/ExplanationPanel";
import type { AlertItem } from "@/components/alerts/AlertsClient";

interface CaseNoteItem {
  note_id: string;
  alert_id: string;
  author_id: string;
  author_name?: string | null;
  note_text: string;
  created_at: string;
}

interface AlertDetailClientProps {
  alertId: string;
  accessToken: string;
  apiBaseUrl: string;
}

export default function AlertDetailClient({
  alertId,
  accessToken,
  apiBaseUrl,
}: AlertDetailClientProps) {
  const [alert, setAlert] = useState<AlertItem | null>(null);
  const [notes, setNotes] = useState<CaseNoteItem[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [addingNote, setAddingNote] = useState(false);

  // Disposition modal state
  const [isDispositionModalOpen, setIsDispositionModalOpen] = useState(false);
  const [outcomeChoice, setOutcomeChoice] = useState<string>(
    "confirmed_suspicious",
  );
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const fetchAlert = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const [alertRes, notesRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/v1/alerts/${alertId}`, { headers }),
        fetch(`${apiBaseUrl}/api/v1/alerts/${alertId}/notes`, { headers }),
      ]);

      if (alertRes.ok) setAlert(await alertRes.json());
      if (notesRes.ok) setNotes(await notesRes.json());
    } finally {
      setLoading(false);
    }
  }, [alertId, accessToken, apiBaseUrl]);

  useEffect(() => {
    fetchAlert();
  }, [fetchAlert]);

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/alerts/${alertId}/notes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ note_text: newNote.trim() }),
      });
      if (res.ok) {
        const added = await res.json();
        setNotes((prev) => [...prev, added]);
        setNewNote("");
      }
    } finally {
      setAddingNote(false);
    }
  }

  async function handleConfirmDisposition() {
    setSubmittingFeedback(true);
    try {
      const res = await fetch(
        `${apiBaseUrl}/api/v1/alerts/${alertId}/feedback`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            outcome_label: outcomeChoice,
            explanation_quality_rating: feedbackRating,
            feedback_notes: feedbackNotes.trim() || undefined,
          }),
        },
      );
      if (res.ok) {
        setIsDispositionModalOpen(false);
        fetchAlert();
      }
    } finally {
      setSubmittingFeedback(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface border-border h-24 animate-pulse rounded-[var(--radius-card)] border"
          />
        ))}
      </div>
    );
  }

  if (!alert) {
    return (
      <div className="text-body text-text-secondary p-6">Alert not found.</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumbs & Header */}
      <div className="border-border flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/alerts"
            className="text-text-secondary hover:text-brand-navy inline-flex items-center gap-1.5 text-xs font-semibold transition-colors dark:hover:text-white"
          >
            <span className="material-symbols-outlined text-[16px]">
              arrow_back
            </span>
            <span>Return to Alerts Queue</span>
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-text-primary text-2xl font-bold tracking-tight">
              Investigation:{" "}
              <span className="text-brand-blue font-mono dark:text-blue-400">
                {alert.alert_id.slice(0, 8)}
              </span>
            </h1>
            <RiskBadge category={alert.risk_category} />
            <StatusPill status={alert.status} />
            {alert.outcome && <StatusPill status={alert.outcome} />}
          </div>
          <p className="text-text-secondary mt-1 text-xs">
            Triggered on{" "}
            <span className="font-mono">
              {new Date(alert.created_at).toLocaleString()}
            </span>
          </p>
        </div>

        {alert.status !== "closed" && (
          <button
            onClick={() => setIsDispositionModalOpen(true)}
            className="bg-brand-navy hover:bg-brand-blue flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-150"
          >
            <span className="material-symbols-outlined text-[16px]">gavel</span>
            <span>Conclude & Dispose Alert</span>
          </button>
        )}
      </div>

      {/* Grid: Alert Info & Explainable Factors */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Metadata & Entities */}
        <div className="border-border bg-surface flex flex-col gap-4 rounded-xl border p-6 shadow-xs">
          <div className="border-border flex items-center gap-2 border-b pb-3">
            <span className="material-symbols-outlined text-brand-blue text-[20px]">
              badge
            </span>
            <h2 className="text-text-primary text-sm font-bold">
              Case Parameters & Entity Metadata
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="border-border rounded-lg border bg-slate-50/70 p-3 dark:bg-slate-900/50">
              <span className="text-text-secondary block text-[11px] font-semibold tracking-wider uppercase">
                Target Customer
              </span>
              <span className="text-text-primary mt-0.5 block text-sm font-bold">
                {alert.customer_name || alert.customer_id || "Unidentified"}
              </span>
              {alert.customer_id && (
                <Link
                  href={`/customers/${alert.customer_id}`}
                  className="text-brand-blue hover:text-brand-blueLight mt-1 inline-flex items-center gap-1 font-semibold hover:underline dark:text-blue-400"
                >
                  View Customer Profile
                  <span className="material-symbols-outlined text-[12px]">
                    arrow_forward
                  </span>
                </Link>
              )}
            </div>
            <div className="border-border rounded-lg border bg-slate-50/70 p-3 dark:bg-slate-900/50">
              <span className="text-text-secondary block text-[11px] font-semibold tracking-wider uppercase">
                Trigger Transaction ID
              </span>
              <span className="text-text-primary mt-0.5 block font-mono text-xs break-all">
                {alert.triggering_transaction_id || "—"}
              </span>
            </div>
            <div className="border-border rounded-lg border bg-slate-50/70 p-3 dark:bg-slate-900/50">
              <span className="text-text-secondary block text-[11px] font-semibold tracking-wider uppercase">
                Assigned Investigator
              </span>
              <span className="text-text-primary mt-0.5 block text-xs font-medium">
                {alert.assigned_to_email || "Unassigned"}
              </span>
            </div>
            <div className="border-border rounded-lg border bg-slate-50/70 p-3 dark:bg-slate-900/50">
              <span className="text-text-secondary block text-[11px] font-semibold tracking-wider uppercase">
                Disposition Outcome
              </span>
              <span className="text-text-primary mt-0.5 block text-xs font-semibold capitalize">
                {alert.outcome?.replace(/_/g, " ") || "Under Review"}
              </span>
            </div>
          </div>
        </div>

        {/* Right: SHAP Explainability for Triggering Txn */}
        <div>
          {alert.triggering_transaction_id ? (
            <ExplanationPanel
              transactionId={alert.triggering_transaction_id}
              apiBaseUrl={apiBaseUrl}
              accessToken={accessToken}
            />
          ) : (
            <div className="border-border bg-surface text-text-secondary flex flex-col items-center justify-center gap-2 rounded-xl border p-6 text-xs">
              <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-600">
                info
              </span>
              <span>
                No individual transaction linked to this alert topology.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Case Notes & Audit Thread */}
      <div className="border-border bg-surface flex flex-col gap-4 rounded-xl border p-6 shadow-xs">
        <div className="border-border flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-gold text-[20px]">
              rate_review
            </span>
            <h2 className="text-text-primary text-sm font-bold">
              Investigator Case Notes & Audit Trail ({notes.length})
            </h2>
          </div>
          <span className="text-text-secondary font-mono text-[11px]">
            APPEND-ONLY LOG
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {notes.length === 0 ? (
            <p className="text-caption text-text-secondary">
              No notes recorded yet. Add notes to document research and external
              findings.
            </p>
          ) : (
            notes.map((n) => (
              <div
                key={n.note_id}
                className="border-border bg-bg flex flex-col gap-1 rounded-md border p-3.5 text-sm"
              >
                <div className="text-caption text-text-secondary flex items-center justify-between">
                  <span className="text-text-primary font-semibold">
                    {n.author_name || "Investigator"}
                  </span>
                  <span className="font-mono text-xs">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-text-primary mt-1 whitespace-pre-wrap">
                  {n.note_text}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Add note form */}
        <form onSubmit={handleAddNote} className="mt-2 flex flex-col gap-2">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add investigation observation or rationale for disposition…"
            rows={3}
            className="border-border bg-bg text-text-primary focus:ring-accent w-full rounded-md border p-3 text-sm outline-none focus:ring-2"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={addingNote || !newNote.trim()}
              className="bg-accent text-surface rounded-md px-4 py-1.5 text-sm font-medium disabled:opacity-50"
            >
              {addingNote ? "Saving…" : "Post Note"}
            </button>
          </div>
        </form>
      </div>

      {/* Disposition Modal */}
      {isDispositionModalOpen && (
        <div className="animate-fade-slide-up fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="border-border bg-surface flex w-full max-w-lg flex-col gap-4 rounded-2xl border p-6 shadow-2xl">
            <div className="border-border flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-brand-navy dark:text-brand-gold text-[22px]">
                  gavel
                </span>
                <h3 className="text-text-primary text-base font-bold">
                  Alert Disposition & Resolution
                </h3>
              </div>
              <button
                onClick={() => setIsDispositionModalOpen(false)}
                className="text-text-secondary hover:text-text-primary rounded-lg p-1 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4 text-xs">
              <div>
                <label className="text-text-secondary mb-1.5 block text-xs font-semibold tracking-wider uppercase">
                  Investigation Outcome
                </label>
                <select
                  value={outcomeChoice}
                  onChange={(e) => setOutcomeChoice(e.target.value)}
                  className="border-border bg-surface text-text-primary focus:border-brand-blue focus:ring-brand-blue/20 w-full cursor-pointer rounded-lg border p-2.5 text-xs font-medium outline-none focus:ring-2"
                >
                  <option value="confirmed_suspicious">
                    Confirmed Suspicious (Eligible for SAR Filing)
                  </option>
                  <option value="false_positive">
                    False Positive (Benign Activity)
                  </option>
                  <option value="further_investigation">
                    Escalate for Further Law Enforcement Inquiry
                  </option>
                </select>
              </div>

              <div>
                <label className="text-text-secondary mb-1.5 block text-xs font-semibold tracking-wider uppercase">
                  XAI Explanation Quality Rating (1 - 5)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackRating(star)}
                      className={`h-9 w-9 rounded-lg text-xs font-bold transition-all ${
                        feedbackRating >= star
                          ? "scale-105 bg-amber-500 text-white shadow-xs"
                          : "bg-surface border-border text-text-secondary border hover:border-amber-400"
                      }`}
                    >
                      {star}★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-text-secondary mb-1.5 block text-xs font-semibold tracking-wider uppercase">
                  Resolution Feedback & Retraining Notes
                </label>
                <textarea
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  placeholder="Document notes explaining your decision to improve future model calibration…"
                  rows={3}
                  className="border-border bg-surface text-text-primary focus:border-brand-blue focus:ring-brand-blue/20 w-full rounded-lg border p-3 text-xs outline-none placeholder:text-slate-400 focus:ring-2"
                />
              </div>
            </div>

            <div className="border-border mt-2 flex justify-end gap-2.5 border-t pt-4">
              <button
                onClick={() => setIsDispositionModalOpen(false)}
                className="border-border text-text-secondary rounded-lg border px-4 py-2 text-xs font-semibold transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDisposition}
                disabled={submittingFeedback}
                className="bg-brand-navy hover:bg-brand-blue rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-150 disabled:opacity-50"
              >
                {submittingFeedback
                  ? "Submitting…"
                  : "Confirm Disposition & Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
