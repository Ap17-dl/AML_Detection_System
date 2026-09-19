"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

export interface TrendPoint {
  date: string;
  score: number;
  category: string;
  reason?: string;
}

interface TrendChartProps {
  data: TrendPoint[];
  height?: number;
}

export function TrendChart({ data, height = 240 }: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-border bg-bg text-caption text-text-secondary"
        style={{ height }}
      >
        No historical risk points recorded yet.
      </div>
    );
  }

  // Format data for chart
  const formattedData = data.map((d) => ({
    ...d,
    formattedDate: new Date(d.date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={formattedData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
          <XAxis
            dataKey="formattedDate"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 1]}
            ticks={[0, 0.3, 0.7, 1.0]}
            tick={{ fontSize: 11, fill: "#6b7280" }}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const pt = payload[0].payload as TrendPoint & { formattedDate: string };
                return (
                  <div className="rounded-md border border-border bg-surface p-2.5 shadow-md text-xs">
                    <p className="font-semibold text-text-primary">{pt.formattedDate}</p>
                    <p className="text-text-secondary mt-0.5">
                      Risk Score:{" "}
                      <span className="font-mono font-medium text-text-primary">
                        {(pt.score * 100).toFixed(1)}%
                      </span>
                    </p>
                    <p className="capitalize text-text-secondary">
                      Category:{" "}
                      <span
                        className={`font-medium ${
                          pt.category === "high"
                            ? "text-red-500"
                            : pt.category === "medium"
                            ? "text-amber-500"
                            : "text-emerald-500"
                        }`}
                      >
                        {pt.category}
                      </span>
                    </p>
                    {pt.reason && (
                      <p className="text-text-secondary text-[11px] mt-1 border-t pt-1">
                        Reason: {pt.reason.replace(/_/g, " ")}
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          <ReferenceLine
            y={0.7}
            stroke="#ef4444"
            strokeDasharray="3 3"
            label={{ value: "High (0.70)", fill: "#ef4444", fontSize: 10, position: "insideTopRight" }}
          />
          <ReferenceLine
            y={0.3}
            stroke="#10b981"
            strokeDasharray="3 3"
            label={{ value: "Low (0.30)", fill: "#10b981", fontSize: 10, position: "insideBottomRight" }}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#f59e0b"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#riskGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
