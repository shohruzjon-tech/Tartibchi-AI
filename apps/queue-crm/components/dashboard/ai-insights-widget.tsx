"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Brain,
  TrendingUp,
  AlertTriangle,
  Trophy,
  Lightbulb,
  RefreshCcw,
  ChevronDown,
} from "lucide-react";

interface AiInsightsData {
  summary: string;
  insights: string[];
  recommendations: string[];
  topPerformers: string[];
  alerts: string[];
}

interface AiInsightsWidgetProps {
  data: AiInsightsData | null;
  loading: boolean;
  onRefresh: () => void;
  title: string;
  labels: {
    poweredBy: string;
    insights: string;
    recommendations: string;
    topPerformers: string;
    alerts: string;
    loading: string;
    noData: string;
    refresh: string;
  };
}

const sectionConfig = [
  {
    key: "insights" as const,
    icon: Brain,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    key: "recommendations" as const,
    icon: Lightbulb,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    key: "topPerformers" as const,
    icon: Trophy,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    key: "alerts" as const,
    icon: AlertTriangle,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
];

export function AiInsightsWidget({
  data,
  loading,
  onRefresh,
  title,
  labels,
}: AiInsightsWidgetProps) {
  const [expanded, setExpanded] = useState<string | null>("insights");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="card overflow-hidden"
    >
      {/* Header with gradient */}
      <div className="relative bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-content-primary">
                {title}
              </h2>
              <p className="text-xs text-content-tertiary">
                {labels.poweredBy}
              </p>
            </div>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-surface-secondary disabled:opacity-50"
          >
            <RefreshCcw
              size={16}
              className={`text-content-tertiary ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
                <Brain
                  size={16}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-violet-500"
                />
              </div>
              <p className="text-sm text-content-tertiary">{labels.loading}</p>
            </div>
          </div>
        ) : !data ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Brain size={32} className="mb-3 text-content-tertiary" />
            <p className="text-sm text-content-tertiary">{labels.noData}</p>
            <button
              onClick={onRefresh}
              className="mt-3 text-sm font-medium text-accent-primary hover:underline"
            >
              {labels.refresh}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            {data.summary && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl bg-gradient-to-r from-violet-500/5 to-purple-500/5 p-4"
              >
                <div className="flex items-start gap-2">
                  <TrendingUp
                    size={16}
                    className="mt-0.5 shrink-0 text-violet-500"
                  />
                  <p className="text-sm leading-relaxed text-content-primary">
                    {data.summary}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Collapsible sections */}
            {sectionConfig.map((section) => {
              const items = data[section.key];
              if (!items || items.length === 0) return null;
              const isOpen = expanded === section.key;
              const Icon = section.icon;

              return (
                <div
                  key={section.key}
                  className="overflow-hidden rounded-xl border border-surface-secondary"
                >
                  <button
                    onClick={() => setExpanded(isOpen ? null : section.key)}
                    className="flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-surface-secondary/30"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-lg ${section.bg}`}
                      >
                        <Icon size={14} className={section.color} />
                      </div>
                      <span className="text-sm font-medium text-content-primary">
                        {labels[section.key]}
                      </span>
                      <span className="rounded-full bg-surface-secondary px-1.5 py-0.5 text-[10px] font-medium text-content-tertiary">
                        {items.length}
                      </span>
                    </div>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown
                        size={14}
                        className="text-content-tertiary"
                      />
                    </motion.div>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="space-y-2 px-4 pb-4">
                          {items.map((item, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="flex items-start gap-2 rounded-lg bg-surface-secondary/30 px-3 py-2"
                            >
                              <div
                                className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${section.bg.replace("/10", "")}`}
                                style={{
                                  backgroundColor:
                                    section.color === "text-blue-500"
                                      ? "#3b82f6"
                                      : section.color === "text-amber-500"
                                        ? "#f59e0b"
                                        : section.color === "text-emerald-500"
                                          ? "#10b981"
                                          : "#f43f5e",
                                }}
                              />
                              <p className="text-xs leading-relaxed text-content-secondary">
                                {item}
                              </p>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
