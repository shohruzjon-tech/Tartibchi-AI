"use client";

import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface PeakHoursChartProps {
  data: Array<{ hour: number; count: number }>;
  title: string;
}

export function PeakHoursChart({ data, title }: PeakHoursChartProps) {
  const chartData = Array.from({ length: 24 }, (_, hour) => {
    const found = data.find((d) => d.hour === hour);
    return {
      hour: `${hour.toString().padStart(2, "0")}:00`,
      count: found?.count || 0,
    };
  });

  const maxCount = Math.max(...chartData.map((d) => d.count), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="card p-6"
    >
      <h2 className="mb-6 text-lg font-semibold text-content-primary">
        {title}
      </h2>
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="15%">
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border, #e5e7eb)"
              opacity={0.5}
              vertical={false}
            />
            <XAxis
              dataKey="hour"
              tick={{
                fontSize: 10,
                fill: "var(--color-text-tertiary, #9ca3af)",
              }}
              axisLine={false}
              tickLine={false}
              interval={2}
            />
            <YAxis
              tick={{
                fontSize: 12,
                fill: "var(--color-text-tertiary, #9ca3af)",
              }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-surface-elevated, #fff)",
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: "12px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
              }}
              formatter={(value: any) => [value, "Tickets"]}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => {
                const intensity = entry.count / maxCount;
                const color =
                  intensity > 0.7
                    ? "#f43f5e"
                    : intensity > 0.4
                      ? "#f59e0b"
                      : "#3b82f6";
                return <Cell key={i} fill={color} opacity={0.85} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-content-tertiary">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          <span>Low</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
          <span>High</span>
        </div>
      </div>
    </motion.div>
  );
}
