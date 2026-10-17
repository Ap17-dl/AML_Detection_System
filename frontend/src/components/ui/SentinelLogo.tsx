import type { SVGProps } from "react";

interface SentinelMarkProps extends SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

/**
 * Minimalist geometric mark for AML Sentinel.
 * Encapsulates a precision shield geometry and connected graph network nodes.
 */
export function SentinelMark({ size = 28, className = "", ...props }: SentinelMarkProps) {
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
      <defs>
        <linearGradient id="sentinel-shield-grad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="currentColor" stopOpacity="0.95" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.6" />
        </linearGradient>
        <radialGradient id="sentinel-pulse" cx="16" cy="16" r="6" gradientUnits="userSpaceOnUse">
          <stop stopColor="currentColor" stopOpacity="0.4" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Subtle outer geometric perimeter */}
      <path
        d="M16 3L27 7.8V15.2C27 22.4 22.3 27.5 16 29.5C9.7 27.5 5 22.4 5 15.2V7.8L16 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-40"
      />

      {/* Internal Graph Network & Apex Node */}
      <path
        d="M16 7L22 13.5M16 7L10 13.5M16 7V22M10 13.5L16 22M22 13.5L16 22M10 13.5H22"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-70"
      />

      {/* Center Graph Vertices */}
      <circle cx="16" cy="7" r="1.75" fill="currentColor" />
      <circle cx="10" cy="13.5" r="1.5" fill="currentColor" />
      <circle cx="22" cy="13.5" r="1.5" fill="currentColor" />
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
  size = 28,
  showSubtitle = true,
  subtitle = "SURVEILLANCE",
  className = "",
}: SentinelLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-text-primary shadow-xs transition-colors">
        <SentinelMark size={size} />
      </div>
      <div className="flex flex-col">
        <span className="text-text-primary text-sm font-bold tracking-tight leading-none">
          AML <span className="font-extrabold tracking-normal">SENTINEL</span>
        </span>
        {showSubtitle && (
          <span className="text-text-secondary mt-1 text-[9px] font-semibold tracking-wider uppercase leading-none opacity-80">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
