"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  previousValue?: number;
  icon: LucideIcon;
  gradient: string;
  bg: string;
  color: string;
  index: number;
  suffix?: string;
}

export function StatCard({
  title,
  value,
  previousValue,
  icon: Icon,
  gradient,
  bg,
  color,
  index,
  suffix,
}: StatCardProps) {
  const numValue = typeof value === "number" ? value : parseFloat(value) || 0;
  const change =
    previousValue !== undefined && previousValue > 0
      ? ((numValue - previousValue) / previousValue) * 100
      : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="card p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium text-content-secondary">{title}</p>
        <div className={`rounded-xl ${bg} p-2`}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <p className="text-3xl font-bold text-content-primary">
        {value}
        {suffix && (
          <span className="ml-1 text-sm font-normal text-content-tertiary">
            {suffix}
          </span>
        )}
      </p>
      {change !== undefined && (
        <div className="mt-2 flex items-center gap-1">
          {change > 0 ? (
            <TrendingUp size={14} className="text-status-success" />
          ) : change < 0 ? (
            <TrendingDown size={14} className="text-status-error" />
          ) : (
            <Minus size={14} className="text-content-tertiary" />
          )}
          <span
            className={`text-xs font-medium ${
              change > 0
                ? "text-status-success"
                : change < 0
                  ? "text-status-error"
                  : "text-content-tertiary"
            }`}
          >
            {change > 0 ? "+" : ""}
            {change.toFixed(1)}%
          </span>
          <span className="text-xs text-content-tertiary">vs yesterday</span>
        </div>
      )}
    </motion.div>
  );
}
