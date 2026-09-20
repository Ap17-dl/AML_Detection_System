"use client";

interface StatusPillProps {
  status: string | null | undefined;
}

export function StatusPill({ status }: StatusPillProps) {
  const norm = (status || "open").toLowerCase();

  let styles = "bg-slate-100 text-slate-700 border-slate-200";
  let label = norm;

  if (norm === "open") {
    styles = "bg-blue-50 text-blue-700 border-blue-200";
    label = "Open";
  } else if (norm === "in_progress") {
    styles = "bg-amber-50 text-amber-700 border-amber-200";
    label = "In Progress";
  } else if (norm === "closed") {
    styles = "bg-emerald-50 text-emerald-700 border-emerald-200";
    label = "Closed";
  } else if (norm === "confirmed_suspicious") {
    styles = "bg-red-50 text-red-700 border-red-200";
    label = "Confirmed Suspicious";
  } else if (norm === "false_positive") {
    styles = "bg-emerald-50 text-emerald-700 border-emerald-200";
    label = "False Positive";
  } else if (norm === "further_investigation") {
    styles = "bg-purple-50 text-purple-700 border-purple-200";
    label = "Further Investigation";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${styles}`}
    >
      {label}
    </span>
  );
}
