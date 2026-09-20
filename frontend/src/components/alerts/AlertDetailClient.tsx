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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/alerts"
            className="text-caption text-accent hover:underline"
          >
            ← Back to Alerts Queue
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-page-title text-text-primary">
              Investigation: {alert.alert_id.slice(0, 8)}
            </h1>
            <RiskBadge category={alert.risk_category} />
            <StatusPill status={alert.status} />
            {alert.outcome && <StatusPill status={alert.outcome} />}
          </div>
          <span className="text-caption text-text-secondary">
            Triggered on {new Date(alert.created_at).toLocaleString()}
          </span>
        </div>

        {alert.status !== "closed" && (
          <button
            onClick={() => setIsDispositionModalOpen(true)}
            className="bg-accent text-surface hover:bg-accent/90 rounded-md px-4 py-2 text-sm font-semibold shadow-sm transition-colors"
          >
            Conclude & Dispose Alert →
          </button>
        )}
      </div>

      {/* Grid: Alert Info & Explainable Factors */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Metadata & Entities */}
        <div className="border-border bg-surface flex flex-col gap-4 rounded-[var(--radius-card)] border p-6 shadow-sm">
          <h2 className="text-section-title text-text-primary border-b pb-2">
            Case Parameters
          </h2>
          <div className="text-body grid grid-cols-2 gap-4">
            <div>
              <span className="text-caption text-text-secondary block">
                Target Customer
              </span>
              <span className="text-text-primary font-medium">
                {alert.customer_name || alert.customer_id || "Unidentified"}
              </span>
              {alert.customer_id && (
                <Link
                  href={`/customers/${alert.customer_id}`}
                  className="text-accent mt-0.5 block text-xs hover:underline"
                >
                  View Customer Profile →
                </Link>
              )}
            </div>
            <div>
              <span className="text-caption text-text-secondary block">
                Trigger Transaction ID
              </span>
              <span className="text-text-primary font-mono text-xs break-all">
                {alert.triggering_transaction_id || "—"}
              </span>
            </div>
            <div>
              <span className="text-caption text-text-secondary block">
                Assigned Investigator
              </span>
              <span className="text-sm">
                {alert.assigned_to_email || "Unassigned"}
              </span>
            </div>
            <div>
              <span className="text-caption text-text-secondary block">
                Disposition Outcome
              </span>
              <span className="text-sm font-medium capitalize">
                {alert.outcome?.replace(/_/g, " ") || "Pending"}
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
            <div className="border-border bg-surface text-caption text-text-secondary rounded-lg border p-6">
              No specific transaction linked to this alert.
            </div>
          )}
        </div>
      </div>

      {/* Case Notes & Audit Thread */}
      <div className="border-border bg-surface flex flex-col gap-4 rounded-[var(--radius-card)] border p-6 shadow-sm">
        <h2 className="text-section-title text-text-primary">
          Investigator Case Notes ({notes.length})
        </h2>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="border-border bg-surface flex w-full max-w-lg flex-col gap-4 rounded-[var(--radius-card)] border p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-section-title text-text-primary">
                Alert Disposition & Resolution
              </h3>
              <button
                onClick={() => setIsDispositionModalOpen(false)}
                className="text-text-secondary hover:text-text-primary"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4 text-sm">
              <div>
                <label className="text-caption text-text-secondary mb-1 block font-semibold">
                  Investigation Outcome
                </label>
                <select
                  value={outcomeChoice}
                  onChange={(e) => setOutcomeChoice(e.target.value)}
                  className="border-border bg-bg text-text-primary w-full rounded-md border p-2"
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
                <label className="text-caption text-text-secondary mb-1 block font-semibold">
                  XAI Explanation Quality Rating (1 - 5)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackRating(star)}
                      className={`h-8 w-8 rounded text-sm font-semibold ${
                        feedbackRating >= star
                          ? "bg-amber-500 text-white"
                          : "bg-bg border-border text-text-secondary border"
                      }`}
                    >
                      {star}★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-caption text-text-secondary mb-1 block font-semibold">
                  Resolution Feedback & Retraining Notes
                </label>
                <textarea
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  placeholder="Notes explaining your decision to improve model precision…"
                  rows={3}
                  className="border-border bg-bg text-text-primary w-full rounded-md border p-2"
                />
              </div>
            </div>

            <div className="mt-2 flex justify-end gap-3 border-t pt-4">
              <button
                onClick={() => setIsDispositionModalOpen(false)}
                className="border-border text-text-secondary hover:bg-bg rounded-md border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDisposition}
                disabled={submittingFeedback}
                className="bg-accent text-surface hover:bg-accent/90 rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-50"
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
