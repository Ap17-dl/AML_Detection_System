"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface DistributionChartProps {
  data: { name: string; value: number; color: string }[];
  height?: number;
}

export function DistributionChart({
  data,
  height = 240,
}: DistributionChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div
        className="border-border bg-bg text-caption text-text-secondary flex items-center justify-center rounded-lg border"
        style={{ height }}
      >
        No activity recorded yet.
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                const pct =
                  total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
                return (
                  <div className="border-border bg-surface rounded-md border p-2 text-xs shadow-md">
                    <p className="text-text-primary font-semibold capitalize">
                      {item.name}
                    </p>
                    <p className="text-text-secondary mt-0.5">
                      Count:{" "}
                      <span className="font-mono font-medium">
                        {item.value}
                      </span>{" "}
                      ({pct}%)
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => (
              <span className="text-text-secondary text-xs capitalize">
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
