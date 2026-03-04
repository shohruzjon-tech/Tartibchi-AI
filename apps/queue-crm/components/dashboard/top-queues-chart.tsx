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

interface TopQueuesChartProps {
  data: Array<{ _id: string; count: number; name?: string }>;
  title: string;
}

const QUEUE_COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"];

export function TopQueuesChart({ data, title }: TopQueuesChartProps) {
  const chartData = data.map((d, i) => ({
    name: d.name || `Queue ${i + 1}`,
    tickets: d.count,
    id: d._id,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="card p-6"
    >
      <h2 className="mb-6 text-lg font-semibold text-content-primary">
        {title}
      </h2>
      {chartData.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center text-sm text-content-tertiary">
          No queue data available
        </div>
      ) : (
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 0, right: 20 }}
              barCategoryGap="20%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border, #e5e7eb)"
                opacity={0.5}
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{
                  fontSize: 12,
                  fill: "var(--color-text-tertiary, #9ca3af)",
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{
                  fontSize: 11,
                  fill: "var(--color-text-secondary, #6b7280)",
                }}
                axisLine={false}
                tickLine={false}
                width={100}
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
              <Bar dataKey="tickets" radius={[0, 6, 6, 0]}>
                {chartData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={QUEUE_COLORS[i % QUEUE_COLORS.length]}
                    opacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
