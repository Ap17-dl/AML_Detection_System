"use client";

interface StatusPillProps {
  status: string | null | undefined;
}

export function StatusPill({ status }: StatusPillProps) {
  const norm = (status || "open").toLowerCase();

  let styles = "bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";
  let dotColor = "bg-slate-400";
  let label = norm;

  if (norm === "open") {
    styles = "bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/40";
    dotColor = "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]";
    label = "Open";
  } else if (norm === "in_progress") {
    styles = "bg-amber-50/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/40";
    dotColor = "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]";
    label = "In Progress";
  } else if (norm === "closed") {
    styles = "bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/40";
    dotColor = "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]";
    label = "Closed";
  } else if (norm === "confirmed_suspicious") {
    styles = "bg-red-50/80 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200/80 dark:border-red-800/40";
    dotColor = "bg-red-600 animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.6)]";
    label = "Confirmed Suspicious";
  } else if (norm === "false_positive") {
    styles = "bg-slate-100/90 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";
    dotColor = "bg-slate-400";
    label = "False Positive";
  } else if (norm === "further_investigation") {
    styles = "bg-purple-50/80 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/40";
    dotColor = "bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.5)]";
    label = "Further Investigation";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all ${styles}`}
    >
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotColor}`} aria-hidden="true" />
      {label}
    </span>
  );
}
