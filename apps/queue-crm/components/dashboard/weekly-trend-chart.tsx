"use client";

import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface WeeklyTrendChartProps {
  data: Array<{
    date: string;
    totalTickets: number;
    totalServed: number;
    totalSkipped: number;
  }>;
  title: string;
  labels: {
    tickets: string;
    served: string;
    skipped: string;
  };
}

export function WeeklyTrendChart({
  data,
  title,
  labels,
}: WeeklyTrendChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString("en", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="card p-6"
    >
      <h2 className="mb-6 text-lg font-semibold text-content-primary">
        {title}
      </h2>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formatted}>
            <defs>
              <linearGradient id="gradTickets" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradServed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradSkipped" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
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
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-surface-elevated, #fff)",
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: "12px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
              }}
              labelStyle={{ fontWeight: 600, marginBottom: 4 }}
            />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span className="text-xs text-content-secondary">{value}</span>
              )}
            />
            <Area
              type="monotone"
              dataKey="totalTickets"
              name={labels.tickets}
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#gradTickets)"
            />
            <Area
              type="monotone"
              dataKey="totalServed"
              name={labels.served}
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#gradServed)"
            />
            <Area
              type="monotone"
              dataKey="totalSkipped"
              name={labels.skipped}
              stroke="#f43f5e"
              strokeWidth={2}
              fill="url(#gradSkipped)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
