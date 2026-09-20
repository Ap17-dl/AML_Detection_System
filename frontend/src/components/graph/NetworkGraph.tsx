"use client";

import dynamic from "next/dynamic";
import { useCallback } from "react";

// Dynamically load ForceGraph2D with ssr disabled
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="border-border bg-bg text-caption text-text-secondary flex h-[500px] w-full animate-pulse items-center justify-center rounded-lg border">
      Initializing interactive graph canvas…
    </div>
  ),
});

export interface GraphNodeData {
  id: string;
  label: string;
  type: string;
  risk_score?: number | null;
  risk_category?: string | null;
  in_degree: number;
  out_degree: number;
}

export interface GraphEdgeData {
  source: string;
  target: string;
  amount: number;
  transaction_count: number;
  currency: string;
  risk_category?: string | null;
}

interface NetworkGraphProps {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
  selectedNodeId?: string | null;
  onNodeClick?: (node: GraphNodeData) => void;
  width?: number;
  height?: number;
}

export function NetworkGraph({
  nodes,
  edges,
  selectedNodeId,
  onNodeClick,
  height = 560,
}: NetworkGraphProps) {
  const graphData = {
    nodes: nodes.map((n) => ({ ...n })),
    links: edges.map((e) => ({ ...e })),
  };

  const handleNodeColor = useCallback(
    (node: { id?: string | number; risk_category?: string | null }) => {
      if (node.id === selectedNodeId) return "#3b82f6"; // Blue highlight for selected
      if (node.risk_category === "high") return "#ef4444";
      if (node.risk_category === "medium") return "#f59e0b";
      return "#10b981";
    },
    [selectedNodeId],
  );

  return (
    <div className="border-border bg-surface relative w-full overflow-hidden rounded-[var(--radius-card)] border shadow-sm">
      {/* Legend */}
      <div className="bg-surface/90 border-border absolute top-3 left-3 z-10 flex flex-wrap items-center gap-3 rounded-md border px-3 py-1.5 text-xs shadow-sm backdrop-blur-md">
        <span className="text-text-primary font-medium">Risk Legend:</span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> High
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Medium
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Low
        </span>
        <span className="text-text-secondary inline-flex items-center gap-1 border-l pl-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Selected
          Target
        </span>
      </div>

      <ForceGraph2D
        graphData={graphData}
        height={height}
        nodeLabel={(node) => {
          const n = node as unknown as GraphNodeData;
          return `
            <div style="background: #1e293b; color: #fff; padding: 6px 10px; border-radius: 6px; font-size: 12px; font-family: monospace;">
              <strong>${n.label || n.id}</strong><br/>
              Category: <span style="text-transform: capitalize;">${n.risk_category || "low"}</span><br/>
              In: ${n.in_degree ?? 0} | Out: ${n.out_degree ?? 0}
            </div>
          `;
        }}
        nodeColor={handleNodeColor}
        nodeRelSize={7}
        linkColor={(link) => {
          const l = link as unknown as GraphEdgeData;
          return l.risk_category === "high" ? "#ef4444" : "#94a3b8";
        }}
        linkDirectionalArrowLength={5}
        linkDirectionalArrowRelPos={1}
        linkCurvature={0.15}
        linkWidth={(link) => {
          const l = link as unknown as GraphEdgeData;
          return Math.min(
            6,
            Math.max(1.5, Math.log10(((l.amount as number) ?? 0) + 1)),
          );
        }}
        onNodeClick={(node) => {
          if (onNodeClick) {
            onNodeClick(node as unknown as GraphNodeData);
          }
        }}
        cooldownTicks={100}
      />
    </div>
  );
}
