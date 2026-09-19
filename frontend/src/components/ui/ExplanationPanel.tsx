"use client";

import { useEffect, useState } from "react";

export interface FeatureContribution {
  feature: string;
  shap_value: number;
  direction: "increases_risk" | "decreases_risk";
  description: string;
}

export interface ExplanationData {
  explanation_id: string;
  prediction_id: string;
  top_features: FeatureContribution[];
  narrative_text: string;
  generated_at: string;
}

interface ExplanationPanelProps {
  transactionId: string;
  apiBaseUrl: string;
  accessToken: string;
}

export function ExplanationPanel({
  transactionId,
  apiBaseUrl,
  accessToken,
}: ExplanationPanelProps) {
  const [data, setData] = useState<ExplanationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadExplanation() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${apiBaseUrl}/api/v1/transactions/${transactionId}/explanation`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        if (!res.ok) {
          throw new Error(`Failed to load explanation (${res.status})`);
        }
        const json = await res.json();
        if (!cancelled) {
          setData(json);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load explanation");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadExplanation();
    return () => {
      cancelled = true;
    };
  }, [transactionId, apiBaseUrl, accessToken]);

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-bg p-4 flex flex-col gap-3 animate-pulse">
        <div className="h-4 w-32 bg-border rounded" />
        <div className="h-20 bg-border/60 rounded" />
        <div className="h-12 bg-border/40 rounded" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-border bg-bg p-4 text-caption text-text-secondary">
        {error || "No explanation data available for this transaction."}
      </div>
    );
  }

  const maxAbsVal = Math.max(
    ...data.top_features.map((f) => Math.abs(f.shap_value)),
    0.01
  );

  return (
    <div className="rounded-lg border border-border bg-bg p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between border-b pb-2">
        <span className="text-label text-text-secondary uppercase tracking-wider font-semibold">
          Explainable AI (SHAP Factors)
        </span>
        <span className="text-xs text-text-secondary">TreeExplainer</span>
      </div>

      {/* Narrative Explanation */}
      <div className="rounded-md bg-surface border border-border/80 p-3 text-body text-text-primary text-sm leading-relaxed">
        <p className="font-medium text-text-secondary text-xs uppercase mb-1">
          Automated Narrative
        </p>
        <p>{data.narrative_text}</p>
      </div>

      {/* Feature Contributions Chart */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-text-secondary">
          Top Contributing Risk Indicators
        </span>
        <div className="flex flex-col gap-2.5">
          {data.top_features.map((feat) => {
            const isRisk = feat.direction === "increases_risk";
            const percentWidth = Math.min(
              100,
              Math.round((Math.abs(feat.shap_value) / maxAbsVal) * 100)
            );

            return (
              <div key={feat.feature} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-caption">
                  <span className="text-text-primary font-medium">
                    {feat.description}
                  </span>
                  <span
                    className={`font-mono text-xs font-semibold ${
                      isRisk ? "text-red-500" : "text-emerald-500"
                    }`}
                  >
                    {isRisk ? `+${feat.shap_value.toFixed(3)}` : feat.shap_value.toFixed(3)}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isRisk ? "bg-red-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${percentWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
