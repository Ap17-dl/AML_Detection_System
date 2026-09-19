"use client";

/**
 * RiskBadge — dot + text label, never color-only (Design Scheme §5, §2.1).
 *
 * Usage: <RiskBadge category="high" />
 */

interface RiskBadgeProps {
  category: "low" | "medium" | "high" | string | null | undefined;
  className?: string;
}

const CONFIG: Record<string, { label: string; dotClass: string; textClass: string }> = {
  low: {
    label: "Low",
    dotClass: "bg-risk-low",
    textClass: "text-risk-low",
  },
  medium: {
    label: "Medium",
    dotClass: "bg-risk-medium",
    textClass: "text-risk-medium",
  },
  high: {
    label: "High",
    dotClass: "bg-risk-high",
    textClass: "text-risk-high",
  },
};

export function RiskBadge({ category, className = "" }: RiskBadgeProps) {
  const key = (category ?? "").toLowerCase();
  const config = CONFIG[key];

  if (!config) {
    return (
      <span className={`text-label text-text-secondary ${className}`}>—</span>
    );
  }

  return (
    <span
      className={`text-label inline-flex items-center gap-1.5 ${config.textClass} ${className}`}
      role="status"
      aria-label={`Risk: ${config.label}`}
    >
      <span
        className={`inline-block h-2 w-2 rounded-full ${config.dotClass}`}
        aria-hidden="true"
      />
      {config.label}
    </span>
  );
}
