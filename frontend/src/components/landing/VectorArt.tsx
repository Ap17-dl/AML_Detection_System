import type { SVGProps } from "react";

/**
 * Custom Vector Art: Hero Network Surveillance Mesh
 * Illustrates financial transaction graph topology, multi-hop layering, and anomaly detection.
 */
export function HeroNetworkVectorArt({
  className = "",
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 600 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`h-auto w-full select-none ${className}`}
      {...props}
    >
      <defs>
        {/* Gradients */}
        <linearGradient
          id="grid-grad"
          x1="0"
          y1="0"
          x2="600"
          y2="400"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#3b82f6" stopOpacity="0.08" />
          <stop offset="1" stopColor="#10b981" stopOpacity="0.04" />
        </linearGradient>

        <linearGradient
          id="edge-active-1"
          x1="120"
          y1="180"
          x2="300"
          y2="140"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#3b82f6" stopOpacity="0.8" />
          <stop offset="1" stopColor="#8b5cf6" stopOpacity="0.8" />
        </linearGradient>

        <linearGradient
          id="edge-alert"
          x1="300"
          y1="140"
          x2="460"
          y2="230"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#f59e0b" stopOpacity="0.8" />
          <stop offset="1" stopColor="#ef4444" stopOpacity="0.9" />
        </linearGradient>

        <linearGradient
          id="edge-safe"
          x1="300"
          y1="140"
          x2="220"
          y2="300"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#3b82f6" stopOpacity="0.6" />
          <stop offset="1" stopColor="#10b981" stopOpacity="0.8" />
        </linearGradient>

        <radialGradient
          id="radar-pulse"
          cx="300"
          cy="140"
          r="160"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#3b82f6" stopOpacity="0.15" />
          <stop offset="0.6" stopColor="#3b82f6" stopOpacity="0.05" />
          <stop offset="1" stopColor="#3b82f6" stopOpacity="0" />
        </radialGradient>

        <radialGradient
          id="alert-pulse"
          cx="460"
          cy="230"
          r="50"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#ef4444" stopOpacity="0.25" />
          <stop offset="1" stopColor="#ef4444" stopOpacity="0" />
        </radialGradient>

        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Background Geometric Grid Matrix */}
      <rect width="600" height="400" rx="16" fill="url(#grid-grad)" />

      {/* Perspective Grid Floor */}
      <g
        opacity="0.25"
        stroke="currentColor"
        strokeWidth="0.75"
        className="text-slate-400 dark:text-slate-600"
      >
        <line x1="80" y1="360" x2="520" y2="360" />
        <line x1="120" y1="320" x2="480" y2="320" />
        <line x1="160" y1="280" x2="440" y2="280" />
        <line x1="80" y1="360" x2="240" y2="240" />
        <line x1="220" y1="360" x2="280" y2="240" />
        <line x1="380" y1="360" x2="320" y2="240" />
        <line x1="520" y1="360" x2="360" y2="240" />
      </g>

      {/* Central Radar Wave Emitting from Core Engine */}
      <circle cx="300" cy="140" r="140" fill="url(#radar-pulse)" />
      <circle
        cx="300"
        cy="140"
        r="90"
        stroke="#3b82f6"
        strokeWidth="1"
        strokeDasharray="4 4"
        opacity="0.4"
      />
      <circle
        cx="300"
        cy="140"
        r="150"
        stroke="#3b82f6"
        strokeWidth="0.75"
        opacity="0.2"
      />

      {/* Background Network Topology Edges */}
      <g
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.2"
        className="text-slate-400 dark:text-slate-500"
      >
        <line x1="80" y1="90" x2="120" y2="180" />
        <line x1="80" y1="90" x2="200" y2="70" />
        <line x1="200" y1="70" x2="300" y2="140" />
        <line x1="420" y1="70" x2="510" y2="110" />
        <line x1="420" y1="70" x2="300" y2="140" />
        <line x1="510" y1="110" x2="460" y2="230" />
        <line x1="460" y1="230" x2="530" y2="320" />
        <line x1="120" y1="180" x2="150" y2="310" />
        <line x1="150" y1="310" x2="220" y2="300" />
        <line x1="220" y1="300" x2="360" y2="320" />
        <line x1="360" y1="320" x2="460" y2="230" />
      </g>

      {/* Active High-Confidence Graph Edges */}
      <line
        x1="120"
        y1="180"
        x2="300"
        y2="140"
        stroke="url(#edge-active-1)"
        strokeWidth="2.5"
      />
      <line
        x1="300"
        y1="140"
        x2="220"
        y2="300"
        stroke="url(#edge-safe)"
        strokeWidth="2"
        strokeDasharray="6 3"
      />
      <line
        x1="300"
        y1="140"
        x2="460"
        y2="230"
        stroke="url(#edge-alert)"
        strokeWidth="3"
        filter="url(#glow)"
      />

      {/* Suspicious Layering Path: Anomaly Red Rings */}
      <circle cx="460" cy="230" r="42" fill="url(#alert-pulse)" />
      <circle
        cx="460"
        cy="230"
        r="30"
        stroke="#ef4444"
        strokeWidth="1"
        strokeDasharray="3 3"
        opacity="0.6"
      />
      <circle cx="460" cy="230" r="18" fill="#ef4444" fillOpacity="0.15" />

      {/* Outer Peripheral Ingestion Nodes */}
      <g>
        <circle cx="80" cy="90" r="6" fill="#64748b" opacity="0.6" />
        <circle cx="200" cy="70" r="7" fill="#64748b" opacity="0.7" />
        <circle cx="420" cy="70" r="7" fill="#64748b" opacity="0.7" />
        <circle cx="510" cy="110" r="6" fill="#64748b" opacity="0.6" />
        <circle cx="150" cy="310" r="7" fill="#64748b" opacity="0.7" />
        <circle cx="360" cy="320" r="8" fill="#10b981" opacity="0.8" />
        <circle cx="530" cy="320" r="6" fill="#ef4444" opacity="0.6" />
      </g>

      {/* Node 1: Origin Bank Node */}
      <g transform="translate(120, 180)">
        <circle
          cx="0"
          cy="0"
          r="16"
          fill="#1e293b"
          stroke="#3b82f6"
          strokeWidth="2"
        />
        <circle cx="0" cy="0" r="6" fill="#60a5fa" />
        <text
          x="-24"
          y="28"
          fill="currentColor"
          fontSize="10"
          fontWeight="600"
          className="font-mono text-slate-600 dark:text-slate-300"
        >
          NODE: DEPOSIT
        </text>
      </g>

      {/* Node 2: Core ML Engine Vertex (Center) */}
      <g transform="translate(300, 140)">
        <circle
          cx="0"
          cy="0"
          r="24"
          fill="#0f172a"
          stroke="#8b5cf6"
          strokeWidth="2.5"
          filter="url(#glow)"
        />
        <circle cx="0" cy="0" r="12" fill="#6366f1" />
        <circle cx="0" cy="0" r="4" fill="#ffffff" />
        {/* Rotating Geometric Reticle */}
        <polygon
          points="0,-18 16,-8 16,8 0,18 -16,8 -16,-8"
          stroke="#a78bfa"
          strokeWidth="1.25"
          fill="none"
          opacity="0.8"
        />
        <text
          x="-36"
          y="-30"
          fill="currentColor"
          fontSize="11"
          fontWeight="700"
          className="font-mono text-slate-900 dark:text-white"
        >
          GNN CORE #01
        </text>
      </g>

      {/* Node 3: Clean Verified Clearing Node */}
      <g transform="translate(220, 300)">
        <circle
          cx="0"
          cy="0"
          r="16"
          fill="#064e3b"
          stroke="#10b981"
          strokeWidth="2"
        />
        <path
          d="M-4 0L-1 3L5 -3"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text
          x="-32"
          y="26"
          fill="currentColor"
          fontSize="10"
          fontWeight="600"
          className="font-mono text-emerald-600 dark:text-emerald-400"
        >
          CLEARED: 0.02
        </text>
      </g>

      {/* Node 4: Flagged Suspicious Syndicate Shell */}
      <g transform="translate(460, 230)">
        <circle
          cx="0"
          cy="0"
          r="18"
          fill="#7f1d1d"
          stroke="#ef4444"
          strokeWidth="2.5"
          filter="url(#glow)"
        />
        <circle cx="0" cy="0" r="8" fill="#ef4444" />
        <path
          d="M0 -4V1M0 4V5"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <text
          x="-48"
          y="32"
          fill="#ef4444"
          fontSize="10"
          fontWeight="700"
          className="font-mono"
        >
          FLAGGED: 98.4%
        </text>
      </g>

      {/* Floating Tactical Data Badges */}
      <g transform="translate(360, 110)">
        <rect
          width="110"
          height="34"
          rx="6"
          fill="#0f172a"
          fillOpacity="0.9"
          stroke="#ef4444"
          strokeWidth="1"
          strokeOpacity="0.4"
        />
        <text
          x="8"
          y="14"
          fill="#f87171"
          fontSize="9"
          fontWeight="700"
          className="font-mono"
        >
          STRUCTURING DETECTED
        </text>
        <text x="8" y="27" fill="#94a3b8" fontSize="8" className="font-mono">
          Hop 3 • Layering Loop
        </text>
      </g>

      <g transform="translate(80, 240)">
        <rect
          width="95"
          height="28"
          rx="6"
          fill="#0f172a"
          fillOpacity="0.85"
          stroke="#3b82f6"
          strokeWidth="1"
          strokeOpacity="0.3"
        />
        <text
          x="8"
          y="12"
          fill="#60a5fa"
          fontSize="8"
          fontWeight="600"
          className="font-mono"
        >
          INFLOW VELOCITY
        </text>
        <text
          x="8"
          y="22"
          fill="#e2e8f0"
          fontSize="8"
          fontWeight="700"
          className="font-mono"
        >
          1,420 TX/SEC
        </text>
      </g>

      {/* Animated Flow Particles */}
      <circle cx="210" cy="160" r="3" fill="#60a5fa" />
      <circle cx="380" cy="185" r="3.5" fill="#f59e0b" />
      <circle cx="420" cy="208" r="3.5" fill="#ef4444" />
      <circle cx="260" cy="220" r="2.5" fill="#10b981" />
    </svg>
  );
}

/**
 * Vector Art: 4-Stage Surveillance Pipeline
 * Visual representation of data stream -> GNN topology -> triage -> FinCEN dossier
 */
export function PipelineVectorArt({
  className = "",
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 540 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`h-auto w-full select-none ${className}`}
      {...props}
    >
      <defs>
        <linearGradient
          id="pipe-grad"
          x1="20"
          y1="130"
          x2="520"
          y2="130"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#3b82f6" />
          <stop offset="0.5" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#10b981" />
        </linearGradient>
      </defs>

      {/* Backbone Conduit */}
      <line
        x1="50"
        y1="110"
        x2="490"
        y2="110"
        stroke="url(#pipe-grad)"
        strokeWidth="3"
        opacity="0.7"
        strokeDasharray="6 4"
      />

      {/* Stage 1: Stream Ingest */}
      <g transform="translate(60, 110)">
        <rect
          x="-35"
          y="-35"
          width="70"
          height="70"
          rx="12"
          fill="currentColor"
          className="text-surface border-border border"
        />
        <rect
          x="-35"
          y="-35"
          width="70"
          height="70"
          rx="12"
          fill="#3b82f6"
          fillOpacity="0.08"
          stroke="#3b82f6"
          strokeWidth="1.5"
        />
        {/* Streaming icon */}
        <path
          d="M-15 -10H15M-15 0H10M-15 10H5"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <text
          x="0"
          y="55"
          fill="currentColor"
          fontSize="11"
          fontWeight="700"
          textAnchor="middle"
          className="text-text-primary"
        >
          01. Ingestion
        </text>
        <text
          x="0"
          y="70"
          fill="currentColor"
          fontSize="9"
          textAnchor="middle"
          className="text-text-muted font-mono"
        >
          Kafka / REST
        </text>
      </g>

      {/* Stage 2: Subgraph Construction */}
      <g transform="translate(190, 110)">
        <rect
          x="-35"
          y="-35"
          width="70"
          height="70"
          rx="12"
          fill="currentColor"
          className="text-surface"
        />
        <rect
          x="-35"
          y="-35"
          width="70"
          height="70"
          rx="12"
          fill="#6366f1"
          fillOpacity="0.08"
          stroke="#6366f1"
          strokeWidth="1.5"
        />
        {/* Network icon */}
        <circle cx="-8" cy="-6" r="3" fill="#6366f1" />
        <circle cx="8" cy="-6" r="3" fill="#6366f1" />
        <circle cx="0" cy="8" r="3.5" fill="#6366f1" />
        <line
          x1="-8"
          y1="-6"
          x2="8"
          y2="-6"
          stroke="#6366f1"
          strokeWidth="1.5"
        />
        <line
          x1="-8"
          y1="-6"
          x2="0"
          y2="8"
          stroke="#6366f1"
          strokeWidth="1.5"
        />
        <line x1="8" y1="-6" x2="0" y2="8" stroke="#6366f1" strokeWidth="1.5" />
        <text
          x="0"
          y="55"
          fill="currentColor"
          fontSize="11"
          fontWeight="700"
          textAnchor="middle"
          className="text-text-primary"
        >
          02. Topology
        </text>
        <text
          x="0"
          y="70"
          fill="currentColor"
          fontSize="9"
          textAnchor="middle"
          className="text-text-muted font-mono"
        >
          Graph Resolution
        </text>
      </g>

      {/* Stage 3: GNN Inference */}
      <g transform="translate(320, 110)">
        <rect
          x="-35"
          y="-35"
          width="70"
          height="70"
          rx="12"
          fill="currentColor"
          className="text-surface"
        />
        <rect
          x="-35"
          y="-35"
          width="70"
          height="70"
          rx="12"
          fill="#8b5cf6"
          fillOpacity="0.08"
          stroke="#8b5cf6"
          strokeWidth="1.5"
        />
        {/* Neural inference icon */}
        <rect
          x="-12"
          y="-12"
          width="24"
          height="24"
          rx="4"
          stroke="#8b5cf6"
          strokeWidth="1.5"
        />
        <circle cx="0" cy="0" r="3" fill="#8b5cf6" />
        <path
          d="M-6 -6L6 6M-6 6L6 -6"
          stroke="#8b5cf6"
          strokeWidth="1.2"
          opacity="0.6"
        />
        <text
          x="0"
          y="55"
          fill="currentColor"
          fontSize="11"
          fontWeight="700"
          textAnchor="middle"
          className="text-text-primary"
        >
          03. Scoring
        </text>
        <text
          x="0"
          y="70"
          fill="currentColor"
          fontSize="9"
          textAnchor="middle"
          className="text-text-muted font-mono"
        >
          Sub-second ML
        </text>
      </g>

      {/* Stage 4: FinCEN SAR Output */}
      <g transform="translate(450, 110)">
        <rect
          x="-35"
          y="-35"
          width="70"
          height="70"
          rx="12"
          fill="currentColor"
          className="text-surface"
        />
        <rect
          x="-35"
          y="-35"
          width="70"
          height="70"
          rx="12"
          fill="#10b981"
          fillOpacity="0.08"
          stroke="#10b981"
          strokeWidth="1.5"
        />
        {/* Shield / Document icon */}
        <path
          d="M0 -14L12 -8V0C12 7 7 13 0 15C-7 13 -12 7 -12 0V-8L0 -14Z"
          stroke="#10b981"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M-4 0L-1 3L5 -3"
          stroke="#10b981"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text
          x="0"
          y="55"
          fill="currentColor"
          fontSize="11"
          fontWeight="700"
          textAnchor="middle"
          className="text-text-primary"
        >
          04. SAR File
        </text>
        <text
          x="0"
          y="70"
          fill="currentColor"
          fontSize="9"
          textAnchor="middle"
          className="text-text-muted font-mono"
        >
          FinCEN Auditable
        </text>
      </g>

      {/* Directional Chevrons along conduit */}
      <path
        d="M120 106L125 110L120 114"
        stroke="#3b82f6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M250 106L255 110L250 114"
        stroke="#6366f1"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M380 106L385 110L380 114"
        stroke="#8b5cf6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Vector Spot Art: Real-time Radar Scan
 */
export function RealTimeRadarArt({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 80"
      fill="none"
      className={`h-20 w-full ${className}`}
    >
      <circle
        cx="60"
        cy="40"
        r="32"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.15"
      />
      <circle
        cx="60"
        cy="40"
        r="20"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.25"
      />
      <circle
        cx="60"
        cy="40"
        r="8"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.4"
      />
      <line
        x1="60"
        y1="8"
        x2="60"
        y2="72"
        stroke="currentColor"
        strokeWidth="0.75"
        opacity="0.2"
      />
      <line
        x1="28"
        y1="40"
        x2="92"
        y2="40"
        stroke="currentColor"
        strokeWidth="0.75"
        opacity="0.2"
      />
      <line
        x1="60"
        y1="40"
        x2="82"
        y2="24"
        stroke="#3b82f6"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="78" cy="27" r="3" fill="#3b82f6" />
      <circle cx="48" cy="48" r="2.5" fill="#f59e0b" />
    </svg>
  );
}

/**
 * Vector Spot Art: Topology Cluster
 */
export function TopologyClusterArt({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 80"
      fill="none"
      className={`h-20 w-full ${className}`}
    >
      <line
        x1="30"
        y1="40"
        x2="60"
        y2="20"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.3"
      />
      <line
        x1="60"
        y1="20"
        x2="90"
        y2="35"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.3"
      />
      <line
        x1="30"
        y1="40"
        x2="55"
        y2="60"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.3"
      />
      <line
        x1="55"
        y1="60"
        x2="90"
        y2="35"
        stroke="#ef4444"
        strokeWidth="1.8"
      />
      <line
        x1="60"
        y1="20"
        x2="55"
        y2="60"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.3"
      />

      <circle cx="30" cy="40" r="5" fill="#64748b" />
      <circle cx="60" cy="20" r="6" fill="#3b82f6" />
      <circle cx="55" cy="60" r="5" fill="#f59e0b" />
      <circle cx="90" cy="35" r="7" fill="#ef4444" />
      <circle
        cx="90"
        cy="35"
        r="11"
        stroke="#ef4444"
        strokeWidth="1"
        strokeDasharray="2 2"
        opacity="0.6"
      />
    </svg>
  );
}

/**
 * Vector Spot Art: Regulatory Dossier Seal
 */
export function DossierSealArt({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 80"
      fill="none"
      className={`h-20 w-full ${className}`}
    >
      <rect
        x="36"
        y="12"
        width="48"
        height="56"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.3"
      />
      <line
        x1="44"
        y1="22"
        x2="68"
        y2="22"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.4"
      />
      <line
        x1="44"
        y1="30"
        x2="76"
        y2="30"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.3"
      />
      <line
        x1="44"
        y1="38"
        x2="70"
        y2="38"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.3"
      />
      <circle
        cx="64"
        cy="52"
        r="10"
        fill="#10b981"
        fillOpacity="0.15"
        stroke="#10b981"
        strokeWidth="1.5"
      />
      <path
        d="M60 52L63 55L69 49"
        stroke="#10b981"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Vector Spot Art: Explainable SHAP Spectrum
 */
export function ExplainableShapArt({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 80"
      fill="none"
      className={`h-20 w-full ${className}`}
    >
      <line
        x1="60"
        y1="14"
        x2="60"
        y2="66"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.2"
      />
      {/* SHAP Bars */}
      <rect
        x="60"
        y="18"
        width="32"
        height="7"
        rx="2"
        fill="#ef4444"
        fillOpacity="0.8"
      />
      <rect
        x="38"
        y="29"
        width="22"
        height="7"
        rx="2"
        fill="#10b981"
        fillOpacity="0.8"
      />
      <rect
        x="60"
        y="40"
        width="24"
        height="7"
        rx="2"
        fill="#f59e0b"
        fillOpacity="0.8"
      />
      <rect
        x="46"
        y="51"
        width="14"
        height="7"
        rx="2"
        fill="#10b981"
        fillOpacity="0.8"
      />
    </svg>
  );
}
