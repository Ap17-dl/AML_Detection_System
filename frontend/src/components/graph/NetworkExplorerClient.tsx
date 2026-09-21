"use client";

import { useState, useEffect, useCallback } from "react";
import {
  NetworkGraph,
  type GraphNodeData,
  type GraphEdgeData,
} from "@/components/graph/NetworkGraph";
import { RiskBadge } from "@/components/ui/RiskBadge";

interface GraphIndicators {
  account_id: string;
  in_degree: number;
  out_degree: number;
  fan_in_ratio: number | null;
  fan_out_ratio: number | null;
  is_in_cycle: boolean;
  cycle_length: number | null;
  neighborhood_risk_score: number | null;
}

interface NetworkExplorerClientProps {
  accessToken: string;
  apiBaseUrl: string;
  initialAccountId?: string;
}

export default function NetworkExplorerClient({
  accessToken,
  apiBaseUrl,
  initialAccountId = "",
}: NetworkExplorerClientProps) {
  const [accountId, setAccountId] = useState(initialAccountId);
  const [inputVal, setInputVal] = useState(initialAccountId);
  const [hops, setHops] = useState(2);
  const [nodes, setNodes] = useState<GraphNodeData[]>([]);
  const [edges, setEdges] = useState<GraphEdgeData[]>([]);
  const [indicators, setIndicators] = useState<GraphIndicators | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNodeData | null>(null);

  const fetchGraph = useCallback(
    async (targetId: string, kHops: number) => {
      if (!targetId.trim()) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${apiBaseUrl}/api/v1/graph/accounts/${targetId}?k_hops=${kHops}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );
        if (!res.ok) {
          throw new Error(`Account network query failed (${res.status})`);
        }
        const data = await res.json();
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
        setIndicators(data.indicators || null);
        const match = (data.nodes || []).find(
          (n: GraphNodeData) => n.id === targetId,
        );
        if (match) setSelectedNode(match);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Failed to load network graph",
        );
      } finally {
        setLoading(false);
      }
    },
    [apiBaseUrl, accessToken],
  );

  useEffect(() => {
    if (accountId) {
      fetchGraph(accountId, hops);
    }
  }, [accountId, hops, fetchGraph]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (inputVal.trim()) {
      setAccountId(inputVal.trim());
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="border-border flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-text-primary text-2xl font-bold tracking-tight">
              Graph Network Topology Explorer
            </h1>
            <span className="bg-brand-gold/15 border-brand-gold/30 rounded-full border px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:text-amber-300">
              GNN Subgraph
            </span>
          </div>
          <p className="text-text-secondary mt-1 text-xs">
            Analyze multi-hop transaction topologies, fan-in/fan-out
            structuring, and circular money-mule laundering rings.
          </p>
        </div>
      </div>

      {/* Query Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="border-border bg-surface flex flex-wrap items-center gap-3 rounded-xl border p-4 shadow-xs"
      >
        <div className="relative min-w-[240px] flex-1">
          <span className="material-symbols-outlined absolute inset-y-0 left-3 flex items-center text-[18px] text-slate-400">
            hub
          </span>
          <input
            type="text"
            placeholder="Enter Account ID (UUID) to inspect network topology…"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="border-border bg-surface text-text-primary focus:border-brand-blue focus:ring-brand-blue/15 w-full rounded-lg border py-2 pr-3 pl-9 font-mono text-xs transition-all outline-none placeholder:text-slate-400 focus:ring-2"
          />
        </div>
        <div className="flex items-center gap-2 text-xs">
          <label className="text-text-secondary text-[11px] font-semibold tracking-wider uppercase">
            Neighborhood Hops
          </label>
          <select
            value={hops}
            onChange={(e) => setHops(Number(e.target.value))}
            className="border-border bg-surface text-text-primary focus:border-brand-blue cursor-pointer rounded-lg border px-3 py-2 text-xs outline-none"
          >
            <option value={1}>1-hop (Direct Counterparties)</option>
            <option value={2}>2-hops (Extended Network)</option>
            <option value={3}>3-hops (Deep Flow Clusters)</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-brand-navy hover:bg-brand-blue inline-flex items-center gap-1.5 rounded-lg px-5 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-150 active:scale-95"
        >
          <span className="material-symbols-outlined text-[16px]">
            travel_explore
          </span>
          <span>Explore Network</span>
        </button>
      </form>

      {/* Graph Topological Indicators */}
      {indicators && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border-border bg-surface rounded-[var(--radius-card)] border p-4 shadow-sm">
            <span className="text-caption text-text-secondary">
              Degree Centrality
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-semibold">
                {indicators.in_degree + indicators.out_degree}
              </span>
              <span className="text-text-secondary text-xs">
                (In: {indicators.in_degree} / Out: {indicators.out_degree})
              </span>
            </div>
          </div>

          <div className="border-border bg-surface rounded-[var(--radius-card)] border p-4 shadow-sm">
            <span className="text-caption text-text-secondary">
              Structuring Ratios
            </span>
            <div className="mt-1 flex items-baseline gap-3 font-mono text-sm">
              <span>
                Fan-In: <strong>{indicators.fan_in_ratio ?? "—"}</strong>
              </span>
              <span>
                Fan-Out: <strong>{indicators.fan_out_ratio ?? "—"}</strong>
              </span>
            </div>
          </div>

          <div className="border-border bg-surface rounded-[var(--radius-card)] border p-4 shadow-sm">
            <span className="text-caption text-text-secondary">
              Circular Ring / Cycle
            </span>
            <div className="mt-1">
              {indicators.is_in_cycle ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-500">
                  ⚠️ Cycle Detected (Length {indicators.cycle_length})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500">
                  ✓ No Cycles Detected
                </span>
              )}
            </div>
          </div>

          <div className="border-border bg-surface rounded-[var(--radius-card)] border p-4 shadow-sm">
            <span className="text-caption text-text-secondary">
              Neighborhood Risk Score
            </span>
            <div className="mt-1 flex items-center justify-between">
              <span className="font-mono text-2xl font-semibold">
                {indicators.neighborhood_risk_score != null
                  ? `${(indicators.neighborhood_risk_score * 100).toFixed(1)}%`
                  : "—"}
              </span>
              <RiskBadge
                category={
                  indicators.neighborhood_risk_score &&
                  indicators.neighborhood_risk_score >= 0.7
                    ? "high"
                    : indicators.neighborhood_risk_score &&
                        indicators.neighborhood_risk_score >= 0.3
                      ? "medium"
                      : "low"
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Canvas & Detail Sidebar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          {error ? (
            <div className="border-border bg-surface flex h-[450px] items-center justify-center rounded-lg border p-6 text-center text-red-500">
              {error}
            </div>
          ) : nodes.length === 0 && !loading ? (
            <div className="border-border bg-surface text-text-secondary flex h-[450px] items-center justify-center rounded-lg border p-6 text-center">
              Enter an Account ID above to generate and inspect the
              transactional network graph.
            </div>
          ) : (
            <NetworkGraph
              nodes={nodes}
              edges={edges}
              selectedNodeId={selectedNode?.id}
              onNodeClick={(n) => setSelectedNode(n)}
            />
          )}
        </div>

        {/* Node inspector panel */}
        <div className="border-border bg-surface flex flex-col gap-4 rounded-[var(--radius-card)] border p-5 shadow-sm">
          <h2 className="text-section-title text-text-primary border-b pb-2">
            Selected Entity
          </h2>
          {selectedNode ? (
            <div className="text-body flex flex-col gap-3">
              <div>
                <span className="text-caption text-text-secondary block">
                  Account Number
                </span>
                <span className="text-text-primary font-mono font-semibold">
                  {selectedNode.label}
                </span>
              </div>
              <div>
                <span className="text-caption text-text-secondary block">
                  Account UUID
                </span>
                <span className="text-text-secondary font-mono text-xs break-all">
                  {selectedNode.id}
                </span>
              </div>
              <div>
                <span className="text-caption text-text-secondary block">
                  Risk Classification
                </span>
                <div className="mt-1">
                  <RiskBadge category={selectedNode.risk_category} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 border-t pt-3">
                <div>
                  <span className="text-caption text-text-secondary block">
                    Incoming Flows
                  </span>
                  <span className="font-mono font-semibold">
                    {selectedNode.in_degree}
                  </span>
                </div>
                <div>
                  <span className="text-caption text-text-secondary block">
                    Outgoing Flows
                  </span>
                  <span className="font-mono font-semibold">
                    {selectedNode.out_degree}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setAccountId(selectedNode.id);
                  setInputVal(selectedNode.id);
                }}
                className="border-accent/40 bg-accent/10 text-accent hover:bg-accent/20 mt-4 w-full rounded-md border px-3 py-2 text-xs font-semibold transition-colors"
              >
                Center Graph On This Account →
              </button>
            </div>
          ) : (
            <span className="text-caption text-text-secondary">
              Click any node in the canvas to inspect accounts and counterparty
              connections.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
