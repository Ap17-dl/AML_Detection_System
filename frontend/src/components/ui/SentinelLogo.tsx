import type { SVGProps } from "react";

interface SentinelMarkProps extends SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

/**
 * Clean Institutional Banking Mark for AML Sentinel.
 * Precision heraldic geometric shield enclosing financial network graph vertices.
 */
export function SentinelMark({
  size = 28,
  className = "",
  ...props
}: SentinelMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
      {...props}
    >
      {/* Outer Institutional Shield Perimeter */}
      <path
        d="M16 2.5L27.5 7.5V15.5C27.5 23 22.5 28.5 16 30.5C9.5 28.5 4.5 23 4.5 15.5V7.5L16 2.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-90"
      />

      {/* Internal Vault & Graph Network Conduits */}
      <path
        d="M16 7L22 13M16 7L10 13M16 7V22M10 13L16 22M22 13L16 22M10 13H22"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-70"
      />

      {/* Financial Vertices */}
      <circle cx="16" cy="7" r="1.75" fill="currentColor" />
      <circle cx="10" cy="13" r="1.5" fill="currentColor" />
      <circle cx="22" cy="13" r="1.5" fill="currentColor" />
      <circle cx="16" cy="22" r="1.75" fill="currentColor" />
      <circle cx="16" cy="14" r="2.25" fill="currentColor" />
    </svg>
  );
}

interface SentinelLogoProps {
  size?: number;
  showSubtitle?: boolean;
  subtitle?: string;
  className?: string;
}

export function SentinelLogo({
  size = 22,
  showSubtitle = true,
  subtitle = "INSTITUTIONAL BANKING",
  className = "",
}: SentinelLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="border-border bg-surface text-text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border shadow-xs transition-colors">
        <SentinelMark size={size} />
      </div>
      <div className="flex flex-col">
        <span className="text-text-primary text-sm leading-none font-extrabold tracking-tight">
          AML{" "}
          <span className="text-brand-blue font-black tracking-normal">
            SENTINEL
          </span>
        </span>
        {showSubtitle && (
          <span className="text-text-muted mt-1 text-[8.5px] leading-none font-bold tracking-widest uppercase">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
