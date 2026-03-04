"use client";

import { motion } from "framer-motion";
import { Trophy, Medal, Award, User } from "lucide-react";

interface EmployeeData {
  staffId: string;
  served: number;
  skipped: number;
  started: number;
  totalEvents: number;
  name?: string;
}

interface EmployeePerformanceProps {
  data: EmployeeData[];
  title: string;
  labels: {
    employee: string;
    served: string;
    skipped: string;
    rate: string;
    noData: string;
  };
}

const rankIcons = [Trophy, Medal, Award];
const rankColors = ["text-amber-500", "text-slate-400", "text-amber-700"];

export function EmployeePerformance({
  data,
  title,
  labels,
}: EmployeePerformanceProps) {
  const sorted = [...data].sort((a, b) => b.served - a.served);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="card p-6"
    >
      <h2 className="mb-6 text-lg font-semibold text-content-primary">
        {title}
      </h2>

      {sorted.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-sm text-content-tertiary">
          {labels.noData}
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.slice(0, 8).map((emp, i) => {
            const total = emp.served + emp.skipped;
            const rate = total > 0 ? (emp.served / total) * 100 : 0;
            const RankIcon = rankIcons[i] || User;
            const rankColor = rankColors[i] || "text-content-tertiary";
            const barWidth = sorted[0]?.served
              ? (emp.served / sorted[0].served) * 100
              : 0;

            return (
              <motion.div
                key={emp.staffId}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.05 }}
                className="group relative rounded-xl p-3 transition-colors hover:bg-surface-secondary/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-secondary">
                    <RankIcon size={16} className={rankColor} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-sm font-medium text-content-primary">
                        {emp.name || `Employee #${emp.staffId.slice(-4)}`}
                      </p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-status-success font-medium">
                          {emp.served} {labels.served}
                        </span>
                        <span className="text-status-error">
                          {emp.skipped} {labels.skipped}
                        </span>
                        <span className="rounded-full bg-surface-secondary px-2 py-0.5 font-medium text-content-secondary">
                          {rate.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-surface-secondary">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{
                          delay: 0.4 + i * 0.05,
                          duration: 0.5,
                          ease: "easeOut",
                        }}
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
