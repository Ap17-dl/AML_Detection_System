"use client";

import { useState, type FormEvent } from "react";

import { Spinner } from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/client";
import type { CurrentUser, Role } from "@/types/auth";

const ROLE_LABELS: Record<Role, string> = {
  administrator: "Administrator",
  aml_analyst: "AML Compliance Analyst",
  data_operator: "Data Operator",
};

interface RequestAdminModalProps {
  user: CurrentUser;
  isOpen: boolean;
  onClose: () => void;
}

export function RequestAdminModal({
  user,
  isOpen,
  onClose,
}: RequestAdminModalProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const devToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("aml_dev_token="))
        ?.split("=")[1];

      const token = session?.access_token || devToken || "";
      const apiBase =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

      const res = await fetch(`${apiBase}/api/v1/users/request-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: reason.trim() }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          body?.error?.message ||
            body?.detail ||
            "Failed to submit admin access request.",
        );
      }

      setSuccess(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit request. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleModalClose() {
    setReason("");
    setError(null);
    setSuccess(false);
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="request-admin-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    >
      <div className="animate-fade-slide-up rounded-card border-border bg-surface w-full max-w-md border p-6 shadow-xl">
        {success ? (
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-6"
                aria-hidden="true"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h3
              id="request-admin-title"
              className="text-h3 text-text-primary font-semibold"
            >
              Request Dispatched to Host
            </h3>
            <p className="text-body text-text-secondary">
              An email notification has been sent to the platform host via the
              Resend API with your justification. The host can review and
              approve your elevation to Administrator privileges.
            </p>
            <button
              type="button"
              onClick={handleModalClose}
              className="bg-accent text-body mt-2 rounded-md px-5 py-2 font-medium text-white transition-all hover:-translate-y-px hover:shadow-md"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="border-border flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="bg-accent/10 text-accent flex size-8 items-center justify-center rounded-md">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-4"
                    aria-hidden="true"
                  >
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <h3
                  id="request-admin-title"
                  className="text-section-title text-text-primary"
                >
                  Request Administrator Access
                </h3>
              </div>
              <button
                type="button"
                onClick={handleModalClose}
                className="text-text-secondary hover:text-text-primary text-xl leading-none"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <p className="text-caption text-text-secondary">
              Administrator privileges grant full control over staff RBAC roles,
              model thresholds, and system governance. Your request will be
              emailed directly to the host for verification.
            </p>

            <div className="border-border bg-bg text-caption flex flex-col gap-1.5 rounded-md border p-3">
              <div className="flex justify-between">
                <span className="text-text-secondary">Applicant:</span>
                <span className="text-text-primary font-medium">
                  {user.full_name || user.email}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Email:</span>
                <span className="text-text-primary font-mono">
                  {user.email}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Current Role:</span>
                <span className="text-text-primary font-medium capitalize">
                  {ROLE_LABELS[user.role]}
                </span>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="animate-fade-slide-up border-risk-high/30 bg-risk-high/10 text-caption text-risk-high rounded-md border p-2.5"
              >
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="reason"
                className="text-label text-text-secondary"
              >
                Justification &amp; Business Need
              </label>
              <textarea
                id="reason"
                name="reason"
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why administrative privileges are required (e.g. need to manage analyst roles, configure XGBoost thresholds)..."
                className="text-body border-border bg-surface text-text-primary focus:border-accent focus:ring-accent/30 resize-none rounded-md border p-2.5 transition-colors outline-none focus:ring-2"
              />
            </div>

            <div className="border-border flex justify-end gap-3 border-t pt-3">
              <button
                type="button"
                onClick={handleModalClose}
                disabled={isSubmitting}
                className="text-caption border-border text-text-secondary hover:text-text-primary rounded-md border px-3 py-1.5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || reason.trim().length < 3}
                className="text-caption bg-accent flex items-center gap-1.5 rounded-md px-4 py-1.5 font-medium text-white transition-all hover:shadow-sm disabled:opacity-60"
              >
                {isSubmitting && <Spinner className="size-3.5" />}
                {isSubmitting ? "Submitting…" : "Send Request to Host"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
