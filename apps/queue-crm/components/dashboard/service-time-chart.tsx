"use client";

import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Clock } from "lucide-react";

interface ServiceTimeChartProps {
  data: Array<{
    date: string;
    avgServiceTime: number;
  }>;
  title: string;
}

export function ServiceTimeChart({ data, title }: ServiceTimeChartProps) {
  const formatted = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en", {
      month: "short",
      day: "numeric",
    }),
    avgTime: d.avgServiceTime,
  }));

  const avgAll =
    formatted.length > 0
      ? Math.round(
          formatted.reduce((sum, d) => sum + d.avgTime, 0) / formatted.length,
        )
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="card p-6"
    >
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-content-primary">{title}</h2>
        <div className="flex items-center gap-2 rounded-lg bg-surface-secondary px-3 py-1.5">
          <Clock size={14} className="text-content-tertiary" />
          <span className="text-sm font-medium text-content-primary">
            {avgAll}m
          </span>
          <span className="text-xs text-content-tertiary">avg</span>
        </div>
      </div>
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formatted}>
            <defs>
              <linearGradient id="gradLine" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border, #e5e7eb)"
              opacity={0.5}
            />
            <XAxis
              dataKey="date"
              tick={{
                fontSize: 12,
                fill: "var(--color-text-tertiary, #9ca3af)",
              }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{
                fontSize: 12,
                fill: "var(--color-text-tertiary, #9ca3af)",
              }}
              axisLine={false}
              tickLine={false}
              unit="m"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-surface-elevated, #fff)",
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: "12px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
              }}
              formatter={(value: any) => [`${value}m`, "Avg Service Time"]}
            />
            <Line
              type="monotone"
              dataKey="avgTime"
              stroke="#8b5cf6"
              strokeWidth={2.5}
              dot={{ fill: "#8b5cf6", r: 4, strokeWidth: 0 }}
              activeDot={{
                r: 6,
                stroke: "#8b5cf6",
                strokeWidth: 2,
                fill: "#fff",
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
