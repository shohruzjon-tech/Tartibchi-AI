"use client";

import { motion } from "framer-motion";
import { Activity, Users, Zap, Timer } from "lucide-react";

interface LiveStatusData {
  totalWaiting: number;
  totalServing: number;
  activeCounters: number;
  avgWaitTime: number;
}

interface LiveStatusWidgetProps {
  data: LiveStatusData;
  labels: {
    title: string;
    live: string;
    waiting: string;
    serving: string;
    activeCounters: string;
    avgWait: string;
  };
}

export function LiveStatusWidget({ data, labels }: LiveStatusWidgetProps) {
  const items = [
    {
      icon: Users,
      label: labels.waiting,
      value: data.totalWaiting,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      icon: Zap,
      label: labels.serving,
      value: data.totalServing,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      icon: Activity,
      label: labels.activeCounters,
      value: data.activeCounters,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      icon: Timer,
      label: labels.avgWait,
      value: `${data.avgWaitTime}m`,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="card p-6"
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-content-primary">
          {labels.title}
        </h2>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs font-medium text-emerald-500">
            {labels.live}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              className="rounded-xl bg-surface-secondary/50 p-3"
            >
              <div className="mb-2 flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg ${item.bg}`}
                >
                  <Icon size={14} className={item.color} />
                </div>
              </div>
              <p className="text-xl font-bold text-content-primary">
                {item.value}
              </p>
              <p className="text-[11px] text-content-tertiary">{item.label}</p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
