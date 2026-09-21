"use client";

/**
 * RiskBadge — dot + text label, never color-only (Design Scheme §5, §2.1).
 *
 * Usage: <RiskBadge category="high" />
 */

interface RiskBadgeProps {
  category: "low" | "medium" | "high" | "critical" | string | null | undefined;
  className?: string;
}

const CONFIG: Record<
  string,
  { label: string; dotClass: string; textClass: string; bgClass: string; borderClass: string }
> = {
  low: {
    label: "Low",
    dotClass: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]",
    textClass: "text-emerald-700 dark:text-emerald-400 font-semibold",
    bgClass: "bg-emerald-50 dark:bg-emerald-950/30",
    borderClass: "border-emerald-200 dark:border-emerald-800/40",
  },
  medium: {
    label: "Medium",
    dotClass: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]",
    textClass: "text-amber-700 dark:text-amber-400 font-semibold",
    bgClass: "bg-amber-50 dark:bg-amber-950/30",
    borderClass: "border-amber-200 dark:border-amber-800/40",
  },
  high: {
    label: "High",
    dotClass: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]",
    textClass: "text-rose-700 dark:text-rose-400 font-semibold",
    bgClass: "bg-rose-50 dark:bg-rose-950/30",
    borderClass: "border-rose-200 dark:border-rose-800/40",
  },
  critical: {
    label: "Critical",
    dotClass: "bg-red-600 animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.7)]",
    textClass: "text-red-700 dark:text-red-400 font-bold",
    bgClass: "bg-red-50 dark:bg-red-950/40",
    borderClass: "border-red-300 dark:border-red-700/60",
  },
};

export function RiskBadge({ category, className = "" }: RiskBadgeProps) {
  const key = (category ?? "").toLowerCase();
  const config = CONFIG[key];

  if (!config) {
    return (
      <span className={`text-xs text-text-secondary ${className}`}>—</span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs transition-all ${config.bgClass} ${config.borderClass} ${config.textClass} ${className}`}
      role="status"
      aria-label={`Risk: ${config.label}`}
    >
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${config.dotClass}`}
        aria-hidden="true"
      />
      {config.label}
    </span>
  );
}
