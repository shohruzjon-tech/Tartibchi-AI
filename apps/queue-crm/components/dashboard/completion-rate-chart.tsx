"use client";

import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface CompletionRateChartProps {
  completed: number;
  skipped: number;
  total: number;
  title: string;
  labels: {
    completed: string;
    skipped: string;
    waiting: string;
  };
}

const COLORS = ["#10b981", "#f43f5e", "#f59e0b"];

export function CompletionRateChart({
  completed,
  skipped,
  total,
  title,
  labels,
}: CompletionRateChartProps) {
  const waiting = Math.max(0, total - completed - skipped);
  const data = [
    { name: labels.completed, value: completed },
    { name: labels.skipped, value: skipped },
    { name: labels.waiting, value: waiting },
  ].filter((d) => d.value > 0);

  const rate = total > 0 ? ((completed / total) * 100).toFixed(1) : "0.0";

  if (data.length === 0) {
    data.push({ name: "No data", value: 1 });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="card p-6"
    >
      <h2 className="mb-2 text-lg font-semibold text-content-primary">
        {title}
      </h2>
      <p className="mb-4 text-xs text-content-tertiary">Last 7 days</p>
      <div className="flex items-center gap-6">
        <div className="relative h-[180px] w-[180px]">
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
                stroke="none"
              >
                {data.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-surface-elevated, #fff)",
                  border: "1px solid var(--color-border, #e5e7eb)",
                  borderRadius: "12px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center rate label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-content-primary">
              {rate}%
            </span>
            <span className="text-[10px] text-content-tertiary">Success</span>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {data.map((entry, i) => (
            <div key={entry.name} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <div>
                <p className="text-xs font-medium text-content-primary">
                  {entry.name}
                </p>
                <p className="text-xs text-content-tertiary">{entry.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
