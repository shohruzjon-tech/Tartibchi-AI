"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Ticket,
  CheckCircle2,
  SkipForward,
  Clock,
  Activity,
  RefreshCcw,
  ArrowRight,
  Zap,
  Target,
  Timer,
  CalendarDays,
  UserCheck,
  ChevronRight,
  Layers,
  BarChart2,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadialBarChart,
  RadialBar,
  ComposedChart,
} from "recharts";
import { api } from "../../../../lib/api";
import { useAuthStore } from "../../../../lib/store";
import { DateRangePicker } from "../../../../components/dashboard";
import type { DateRange } from "../../../../components/dashboard";

/* ─────────────────────── Custom Tooltip ─────────────────────── */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl bg-surface-elevated/95 px-4 py-3 shadow-lg ring-1 ring-border-primary/10 backdrop-blur-xl">
      <p className="mb-2 text-xs font-semibold text-content-primary">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-content-secondary">{entry.name}:</span>
          <span className="font-semibold text-content-primary">
            {typeof entry.value === "number"
              ? entry.value.toLocaleString()
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ─────────────────────── Section Header ─────────────────────── */
function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  icon: any;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-primary/20 to-accent-secondary/10">
          <Icon size={18} className="text-accent-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-content-primary">{title}</h2>
          {subtitle && (
            <p className="text-xs text-content-tertiary">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

/* ─────────────────────── Mini Stat Badge ─────────────────────── */
function MiniBadge({
  value,
  change,
  suffix,
}: {
  value: string | number;
  change?: number;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl font-bold text-content-primary">
        {value}
        {suffix && (
          <span className="ml-0.5 text-sm font-normal text-content-tertiary">
            {suffix}
          </span>
        )}
      </span>
      {change !== undefined && change !== 0 && (
        <span
          className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
            change > 0
              ? "bg-status-success/10 text-status-success"
              : "bg-status-error/10 text-status-error"
          }`}
        >
          {change > 0 ? (
            <ArrowUpRight size={12} />
          ) : (
            <ArrowDownRight size={12} />
          )}
          {Math.abs(change).toFixed(1)}%
        </span>
      )}
    </div>
  );
}

/* ─────────────────────── KPI Card ─────────────────────── */
function KpiCard({
  title,
  value,
  previousValue,
  icon: Icon,
  gradient,
  color,
  index,
  suffix,
  sparklineData,
}: {
  title: string;
  value: number;
  previousValue?: number;
  icon: any;
  gradient: string;
  color: string;
  index: number;
  suffix?: string;
  sparklineData?: number[];
}) {
  const change =
    previousValue !== undefined && previousValue > 0
      ? ((value - previousValue) / previousValue) * 100
      : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.06, duration: 0.5, ease: "easeOut" }}
      className="card group relative overflow-hidden p-5"
    >
      {/* Background glow */}
      <div
        className={`absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${gradient} opacity-[0.06] transition-opacity group-hover:opacity-[0.12]`}
      />

      <div className="relative">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-content-secondary">{title}</p>
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-sm`}
          >
            <Icon size={16} className="text-white" />
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold tracking-tight text-content-primary">
              {value.toLocaleString()}
              {suffix && (
                <span className="ml-1 text-sm font-normal text-content-tertiary">
                  {suffix}
                </span>
              )}
            </p>
            {change !== undefined && (
              <div className="mt-1.5 flex items-center gap-1.5">
                {change > 0 ? (
                  <TrendingUp size={13} className="text-status-success" />
                ) : change < 0 ? (
                  <TrendingDown size={13} className="text-status-error" />
                ) : (
                  <Minus size={13} className="text-content-tertiary" />
                )}
                <span
                  className={`text-xs font-semibold ${
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
                <span className="text-[11px] text-content-tertiary">
                  vs prev
                </span>
              </div>
            )}
          </div>

          {/* Inline sparkline */}
          {sparklineData && sparklineData.length > 1 && (
            <div className="h-10 w-20 opacity-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparklineData.map((v, i) => ({ v, i }))}>
                  <defs>
                    <linearGradient
                      id={`spark-${index}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke={color}
                    strokeWidth={1.5}
                    fill={`url(#spark-${index})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────── Generated vs Served Dynamics ─────────────────────── */
function TicketDynamicsChart({
  data,
  title,
  subtitle,
  labels,
}: {
  data: Array<{
    date: string;
    totalTickets: number;
    totalServed: number;
    totalSkipped: number;
  }>;
  title: string;
  subtitle: string;
  labels: { generated: string; served: string; skipped: string; gap: string };
}) {
  const formatted = data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString("en", {
      month: "short",
      day: "numeric",
    }),
    gap: Math.max(0, d.totalTickets - d.totalServed - d.totalSkipped),
  }));

  const totals = data.reduce(
    (acc, d) => ({
      tickets: acc.tickets + d.totalTickets,
      served: acc.served + d.totalServed,
      skipped: acc.skipped + d.totalSkipped,
    }),
    { tickets: 0, served: 0, skipped: 0 },
  );

  const serveRate =
    totals.tickets > 0
      ? ((totals.served / totals.tickets) * 100).toFixed(1)
      : "0";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="card overflow-hidden"
    >
      <div className="border-b border-surface-secondary/60 p-6 pb-4">
        <SectionHeader
          icon={BarChart3}
          title={title}
          subtitle={subtitle}
        />
        {/* Summary pills */}
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/8 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            {labels.generated}: {totals.tickets.toLocaleString()}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/8 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {labels.served}: {totals.served.toLocaleString()}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/8 px-3 py-1 text-xs font-medium text-rose-600 dark:text-rose-400">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            {labels.skipped}: {totals.skipped.toLocaleString()}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-primary/8 px-3 py-1 text-xs font-semibold text-accent-primary">
            <Target size={12} />
            {serveRate}%
          </span>
        </div>
      </div>
      <div className="p-6 pt-4">
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={formatted}>
              <defs>
                <linearGradient
                  id="gradGenerated"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient
                  id="gradServedArea"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border, #e5e7eb)"
                opacity={0.4}
              />
              <XAxis
                dataKey="date"
                tick={{
                  fontSize: 11,
                  fill: "var(--color-text-tertiary, #9ca3af)",
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{
                  fontSize: 11,
                  fill: "var(--color-text-tertiary, #9ca3af)",
                }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                iconSize={8}
                formatter={(value: string) => (
                  <span className="text-xs text-content-secondary">{value}</span>
                )}
              />
              <Area
                type="monotone"
                dataKey="totalTickets"
                name={labels.generated}
                stroke="#3b82f6"
                strokeWidth={2.5}
                fill="url(#gradGenerated)"
                strokeDasharray="6 3"
              />
              <Area
                type="monotone"
                dataKey="totalServed"
                name={labels.served}
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#gradServedArea)"
              />
              <Bar
                dataKey="totalSkipped"
                name={labels.skipped}
                fill="#f43f5e"
                opacity={0.7}
                radius={[3, 3, 0, 0]}
                barSize={14}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────── Customer Engagement Widget ─────────────────────── */
function CustomerEngagementWidget({
  data,
  title,
  subtitle,
  labels,
}: {
  data: Array<{
    date: string;
    totalTickets: number;
    totalServed: number;
    totalSkipped: number;
  }>;
  title: string;
  subtitle: string;
  labels: {
    returning: string;
    satisfaction: string;
    engagement: string;
    completionTrend: string;
    daily: string;
  };
}) {
  // Derive engagement metrics from ticket data
  const engagementData = useMemo(() => {
    return data.map((d) => {
      const total = d.totalTickets || 1;
      const completionRate = (d.totalServed / total) * 100;
      const dropoffRate = (d.totalSkipped / total) * 100;
      const engagementScore = Math.min(
        100,
        completionRate * 0.7 + (100 - dropoffRate) * 0.3,
      );
      return {
        date: new Date(d.date).toLocaleDateString("en", {
          month: "short",
          day: "numeric",
        }),
        completionRate: Math.round(completionRate),
        dropoffRate: Math.round(dropoffRate),
        engagementScore: Math.round(engagementScore),
        tickets: d.totalTickets,
      };
    });
  }, [data]);

  const avgEngagement =
    engagementData.length > 0
      ? Math.round(
          engagementData.reduce((s, d) => s + d.engagementScore, 0) /
            engagementData.length,
        )
      : 0;

  const avgCompletion =
    engagementData.length > 0
      ? Math.round(
          engagementData.reduce((s, d) => s + d.completionRate, 0) /
            engagementData.length,
        )
      : 0;

  const avgDropoff =
    engagementData.length > 0
      ? Math.round(
          engagementData.reduce((s, d) => s + d.dropoffRate, 0) /
            engagementData.length,
        )
      : 0;

  const gaugeData = [
    {
      name: labels.engagement,
      value: avgEngagement,
      fill: avgEngagement >= 75 ? "#10b981" : avgEngagement >= 50 ? "#f59e0b" : "#ef4444",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="card overflow-hidden"
    >
      <div className="border-b border-surface-secondary/60 p-6 pb-4">
        <SectionHeader icon={Users} title={title} subtitle={subtitle} />
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Engagement Score Gauge */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative h-[180px] w-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="72%"
                  outerRadius="100%"
                  startAngle={180}
                  endAngle={0}
                  data={gaugeData}
                >
                  <RadialBar
                    dataKey="value"
                    cornerRadius={12}
                    background={{ fill: "var(--surface-secondary, #eee)" }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                <span className="text-3xl font-bold text-content-primary">
                  {avgEngagement}
                </span>
                <span className="text-[11px] font-medium text-content-tertiary">
                  / 100
                </span>
              </div>
            </div>
            <p className="mt-1 text-sm font-semibold text-content-primary">
              {labels.engagement}
            </p>
            <p className="text-xs text-content-tertiary">
              {avgEngagement >= 75
                ? "Excellent"
                : avgEngagement >= 50
                  ? "Good"
                  : "Needs Improvement"}
            </p>
          </div>

          {/* Metrics */}
          <div className="flex flex-col justify-center gap-4">
            <div className="rounded-xl bg-surface-secondary/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                  </div>
                  <span className="text-sm text-content-secondary">
                    {labels.completionTrend}
                  </span>
                </div>
                <span className="text-lg font-bold text-content-primary">
                  {avgCompletion}%
                </span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-surface-secondary">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${avgCompletion}%` }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                />
              </div>
            </div>

            <div className="rounded-xl bg-surface-secondary/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10">
                    <SkipForward size={14} className="text-rose-500" />
                  </div>
                  <span className="text-sm text-content-secondary">
                    Drop-off Rate
                  </span>
                </div>
                <span className="text-lg font-bold text-content-primary">
                  {avgDropoff}%
                </span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-surface-secondary">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${avgDropoff}%` }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                  className="h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-400"
                />
              </div>
            </div>

            <div className="rounded-xl bg-surface-secondary/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                    <Ticket size={14} className="text-blue-500" />
                  </div>
                  <span className="text-sm text-content-secondary">
                    {labels.daily}
                  </span>
                </div>
                <span className="text-lg font-bold text-content-primary">
                  {data.length > 0
                    ? Math.round(
                        data.reduce((s, d) => s + d.totalTickets, 0) /
                          data.length,
                      )
                    : 0}
                </span>
              </div>
            </div>
          </div>

          {/* Engagement trend mini-chart */}
          <div>
            <p className="mb-3 text-xs font-medium text-content-tertiary uppercase tracking-wider">
              {labels.engagement} Trend
            </p>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={engagementData}>
                  <defs>
                    <linearGradient
                      id="engagementGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop
                        offset="95%"
                        stopColor="#8b5cf6"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" hide />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="engagementScore"
                    name={labels.engagement}
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fill="url(#engagementGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────── Periodical Customer Dynamics ─────────────────────── */
function CustomerDynamicsChart({
  data,
  title,
  subtitle,
  labels,
}: {
  data: Array<{
    date: string;
    totalTickets: number;
    totalServed: number;
    totalSkipped: number;
    avgServiceTime: number;
  }>;
  title: string;
  subtitle: string;
  labels: {
    volume: string;
    avgTime: string;
    trend: string;
    growth: string;
    decline: string;
    stable: string;
    ticketsPerDay: string;
  };
}) {
  const formatted = data.map((d, i) => ({
    date: new Date(d.date).toLocaleDateString("en", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }),
    volume: d.totalTickets,
    avgTime: d.avgServiceTime,
    served: d.totalServed,
    growth:
      i > 0 && data[i - 1].totalTickets > 0
        ? (
            ((d.totalTickets - data[i - 1].totalTickets) /
              data[i - 1].totalTickets) *
            100
          ).toFixed(1)
        : "0",
  }));

  // Calculate overall trend
  const firstHalf = data.slice(0, Math.floor(data.length / 2));
  const secondHalf = data.slice(Math.floor(data.length / 2));
  const firstAvg =
    firstHalf.length > 0
      ? firstHalf.reduce((s, d) => s + d.totalTickets, 0) / firstHalf.length
      : 0;
  const secondAvg =
    secondHalf.length > 0
      ? secondHalf.reduce((s, d) => s + d.totalTickets, 0) / secondHalf.length
      : 0;
  const overallTrend =
    firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="card overflow-hidden"
    >
      <div className="border-b border-surface-secondary/60 p-6 pb-4">
        <div className="flex items-center justify-between">
          <SectionHeader
            icon={Activity}
            title={title}
            subtitle={subtitle}
          />
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              overallTrend > 2
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : overallTrend < -2
                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            }`}
          >
            {overallTrend > 2 ? (
              <TrendingUp size={13} />
            ) : overallTrend < -2 ? (
              <TrendingDown size={13} />
            ) : (
              <Minus size={13} />
            )}
            {overallTrend > 2
              ? labels.growth
              : overallTrend < -2
                ? labels.decline
                : labels.stable}
            <span className="ml-1 opacity-70">
              {Math.abs(overallTrend).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={formatted}>
              <defs>
                <linearGradient
                  id="volumeGrad"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border, #e5e7eb)"
                opacity={0.4}
              />
              <XAxis
                dataKey="date"
                tick={{
                  fontSize: 10,
                  fill: "var(--color-text-tertiary, #9ca3af)",
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{
                  fontSize: 11,
                  fill: "var(--color-text-tertiary, #9ca3af)",
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{
                  fontSize: 11,
                  fill: "var(--color-text-tertiary, #9ca3af)",
                }}
                axisLine={false}
                tickLine={false}
                unit="m"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                iconSize={8}
                formatter={(value: string) => (
                  <span className="text-xs text-content-secondary">{value}</span>
                )}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="volume"
                name={labels.volume}
                stroke="#06b6d4"
                strokeWidth={2.5}
                fill="url(#volumeGrad)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="avgTime"
                name={labels.avgTime}
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ fill: "#f59e0b", r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, stroke: "#f59e0b", strokeWidth: 2, fill: "#fff" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────── Queue Performance Heatmap ─────────────────────── */
function QueuePerformanceWidget({
  queueStats,
  queueNames,
  title,
  subtitle,
  labels,
}: {
  queueStats: Array<{
    _id: string;
    events: Array<{ type: string; count: number }>;
    totalEvents: number;
  }>;
  queueNames: Record<string, string>;
  title: string;
  subtitle: string;
  labels: {
    queue: string;
    created: string;
    completed: string;
    skipped: string;
    total: string;
    rate: string;
  };
}) {
  const tableData = queueStats
    .map((q) => {
      const eventMap: Record<string, number> = {};
      q.events.forEach((e) => (eventMap[e.type] = e.count));
      const created = eventMap["CREATED"] || 0;
      const completed = eventMap["COMPLETED"] || 0;
      const skipped = eventMap["SKIPPED"] || 0;
      const rate = created > 0 ? ((completed / created) * 100).toFixed(1) : "0";
      return {
        id: q._id,
        name: queueNames[q._id] || `Queue ${q._id.slice(-4)}`,
        created,
        completed,
        skipped,
        total: q.totalEvents,
        rate: parseFloat(rate),
      };
    })
    .sort((a, b) => b.total - a.total);

  const maxTotal = Math.max(...tableData.map((d) => d.total), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="card overflow-hidden"
    >
      <div className="border-b border-surface-secondary/60 p-6 pb-4">
        <SectionHeader
          icon={Layers}
          title={title}
          subtitle={subtitle}
        />
      </div>
      <div className="overflow-x-auto">
        {tableData.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-content-tertiary">
            No queue data available
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-secondary/30">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                  {labels.queue}
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                  {labels.created}
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                  {labels.completed}
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                  {labels.skipped}
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                  {labels.rate}
                </th>
                <th className="w-[120px] px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-secondary/40">
              {tableData.map((row, i) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.04 }}
                  className="transition-colors hover:bg-surface-secondary/20"
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-accent-primary" />
                      <span className="font-medium text-content-primary">
                        {row.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-content-primary font-medium">
                    {row.created.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-status-success font-medium">
                    {row.completed.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-status-error font-medium">
                    {row.skipped.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        row.rate >= 80
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : row.rate >= 60
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {row.rate}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-1.5 w-full rounded-full bg-surface-secondary">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-accent-primary to-accent-secondary transition-all"
                        style={{
                          width: `${(row.total / maxTotal) * 100}%`,
                        }}
                      />
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
}

/* ─────────────────────── Peak Hours Heatmap ─────────────────────── */
function PeakHoursHeatmap({
  data,
  title,
  subtitle,
  labels,
}: {
  data: Array<{ hour: number; count: number }>;
  title: string;
  subtitle: string;
  labels: { hour: string; tickets: string; peak: string; quiet: string };
}) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const hourData = Array.from({ length: 24 }, (_, h) => {
    const found = data.find((d) => d.hour === h);
    const count = found?.count || 0;
    const intensity = count / maxCount;
    return { hour: h, count, intensity };
  });

  const peakHour = hourData.reduce(
    (max, h) => (h.count > max.count ? h : max),
    hourData[0],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="card overflow-hidden"
    >
      <div className="border-b border-surface-secondary/60 p-6 pb-4">
        <SectionHeader icon={Clock} title={title} subtitle={subtitle} />
        <div className="mt-2 flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-600 dark:text-violet-400">
            <Zap size={12} />
            {labels.peak}: {peakHour.hour.toString().padStart(2, "0")}:00 (
            {peakHour.count} {labels.tickets.toLowerCase()})
          </span>
        </div>
      </div>
      <div className="p-6">
        {/* Heatmap Grid */}
        <div className="grid grid-cols-12 gap-1.5 sm:grid-cols-24">
          {hourData.map((h) => (
            <div key={h.hour} className="group relative">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.35 + h.hour * 0.02 }}
                className="aspect-square w-full cursor-default rounded-lg transition-transform group-hover:scale-110"
                style={{
                  backgroundColor:
                    h.intensity > 0.7
                      ? `rgba(239, 68, 68, ${0.3 + h.intensity * 0.6})`
                      : h.intensity > 0.4
                        ? `rgba(245, 158, 11, ${0.2 + h.intensity * 0.5})`
                        : h.intensity > 0
                          ? `rgba(59, 130, 246, ${0.1 + h.intensity * 0.4})`
                          : "var(--surface-secondary)",
                }}
                title={`${h.hour.toString().padStart(2, "0")}:00 — ${h.count} tickets`}
              />
              <span className="mt-1 block text-center text-[9px] text-content-tertiary">
                {h.hour.toString().padStart(2, "0")}
              </span>
              {/* Hover tooltip */}
              <div className="pointer-events-none absolute -top-10 left-1/2 z-10 -translate-x-1/2 rounded-lg bg-surface-elevated px-2 py-1 text-xs font-medium text-content-primary opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                {h.count}
              </div>
            </div>
          ))}
        </div>
        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-content-tertiary">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-blue-500/30" />
            <span>{labels.quiet}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-amber-500/50" />
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-rose-500/70" />
            <span>{labels.peak}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────── Completion Funnel ─────────────────────── */
function CompletionFunnelWidget({
  completionRate,
  title,
  labels,
}: {
  completionRate: { completed: number; skipped: number; total: number };
  title: string;
  labels: {
    generated: string;
    served: string;
    skipped: string;
    waiting: string;
    conversionRate: string;
  };
}) {
  const waiting = Math.max(
    0,
    completionRate.total - completionRate.completed - completionRate.skipped,
  );
  const serveRate =
    completionRate.total > 0
      ? ((completionRate.completed / completionRate.total) * 100).toFixed(1)
      : "0";
  const skipRate =
    completionRate.total > 0
      ? ((completionRate.skipped / completionRate.total) * 100).toFixed(1)
      : "0";

  const pieData = [
    { name: labels.served, value: completionRate.completed, color: "#10b981" },
    { name: labels.skipped, value: completionRate.skipped, color: "#f43f5e" },
    { name: labels.waiting, value: waiting, color: "#f59e0b" },
  ].filter((d) => d.value > 0);

  if (pieData.length === 0) {
    pieData.push({ name: "No data", value: 1, color: "#e5e7eb" });
  }

  const funnelSteps = [
    {
      label: labels.generated,
      value: completionRate.total,
      width: 100,
      color: "from-blue-500 to-cyan-500",
    },
    {
      label: labels.served,
      value: completionRate.completed,
      width:
        completionRate.total > 0
          ? (completionRate.completed / completionRate.total) * 100
          : 0,
      color: "from-emerald-500 to-teal-400",
    },
    {
      label: labels.skipped,
      value: completionRate.skipped,
      width:
        completionRate.total > 0
          ? (completionRate.skipped / completionRate.total) * 100
          : 0,
      color: "from-rose-500 to-pink-400",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="card overflow-hidden"
    >
      <div className="border-b border-surface-secondary/60 p-6 pb-4">
        <SectionHeader icon={Target} title={title} subtitle={labels.conversionRate} />
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Donut */}
          <div className="flex flex-col items-center">
            <div className="relative h-[200px] w-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-content-primary">
                  {serveRate}%
                </span>
                <span className="text-[10px] font-medium text-content-tertiary">
                  Success Rate
                </span>
              </div>
            </div>
            <div className="mt-4 flex gap-4">
              {pieData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs text-content-secondary">
                    {entry.name}
                  </span>
                  <span className="text-xs font-semibold text-content-primary">
                    {entry.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Funnel bars */}
          <div className="flex flex-col justify-center gap-4">
            {funnelSteps.map((step, i) => (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-content-secondary">
                    {step.label}
                  </span>
                  <span className="text-sm font-bold text-content-primary">
                    {step.value.toLocaleString()}
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-surface-secondary">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(step.width, 2)}%` }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.7 }}
                    className={`h-full rounded-full bg-gradient-to-r ${step.color}`}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────── Employee Leaderboard ─────────────────────── */
function EmployeeLeaderboard({
  data,
  title,
  subtitle,
  labels,
}: {
  data: Array<{
    staffId: string;
    served: number;
    skipped: number;
    started: number;
    totalEvents: number;
    name?: string;
  }>;
  title: string;
  subtitle: string;
  labels: {
    employee: string;
    served: string;
    skipped: string;
    efficiency: string;
    noData: string;
  };
}) {
  const sorted = [...data].sort((a, b) => b.served - a.served);
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="card overflow-hidden"
    >
      <div className="border-b border-surface-secondary/60 p-6 pb-4">
        <SectionHeader
          icon={UserCheck}
          title={title}
          subtitle={subtitle}
        />
      </div>
      <div className="p-6">
        {sorted.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-content-tertiary">
            {labels.noData}
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.slice(0, 10).map((emp, i) => {
              const total = emp.served + emp.skipped;
              const efficiency =
                total > 0 ? ((emp.served / total) * 100).toFixed(0) : "0";
              const maxServed = sorted[0]?.served || 1;
              const barWidth = (emp.served / maxServed) * 100;

              return (
                <motion.div
                  key={emp.staffId}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.04 }}
                  className="group rounded-xl p-3 transition-colors hover:bg-surface-secondary/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-secondary text-sm">
                      {i < 3 ? medals[i] : <span className="text-xs font-semibold text-content-tertiary">#{i + 1}</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate text-sm font-medium text-content-primary">
                          {emp.name || `Employee #${emp.staffId.slice(-4)}`}
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-semibold text-status-success">
                            {emp.served}
                          </span>
                          <span className="text-content-tertiary">/</span>
                          <span className="text-status-error">
                            {emp.skipped}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 font-semibold ${
                              parseFloat(efficiency) >= 85
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : parseFloat(efficiency) >= 70
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {efficiency}%
                          </span>
                        </div>
                      </div>
                      <div className="mt-1.5 h-1 w-full rounded-full bg-surface-secondary">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${barWidth}%` }}
                          transition={{
                            delay: 0.5 + i * 0.04,
                            duration: 0.5,
                          }}
                          className="h-full rounded-full bg-gradient-to-r from-accent-primary to-accent-secondary"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─────────────────────── Service Time Distribution ─────────────────────── */
function ServiceTimeDistribution({
  data,
  title,
  subtitle,
  labels,
}: {
  data: Array<{ date: string; avgServiceTime: number }>;
  title: string;
  subtitle: string;
  labels: { avgTime: string; min: string; max: string; trend: string };
}) {
  const formatted = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en", {
      month: "short",
      day: "numeric",
    }),
    avgTime: d.avgServiceTime,
  }));

  const times = data.map((d) => d.avgServiceTime).filter((t) => t > 0);
  const avgAll = times.length > 0 ? Math.round(times.reduce((s, t) => s + t, 0) / times.length) : 0;
  const minTime = times.length > 0 ? Math.min(...times) : 0;
  const maxTime = times.length > 0 ? Math.max(...times) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="card overflow-hidden"
    >
      <div className="border-b border-surface-secondary/60 p-6 pb-4">
        <SectionHeader icon={Timer} title={title} subtitle={subtitle} />
        <div className="mt-3 flex gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-surface-secondary/60 px-3 py-1.5">
            <Clock size={13} className="text-violet-500" />
            <span className="text-xs text-content-tertiary">
              {labels.avgTime}:
            </span>
            <span className="text-sm font-bold text-content-primary">
              {avgAll}m
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-surface-secondary/60 px-3 py-1.5">
            <span className="text-xs text-content-tertiary">{labels.min}:</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {minTime}m
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-surface-secondary/60 px-3 py-1.5">
            <span className="text-xs text-content-tertiary">{labels.max}:</span>
            <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
              {maxTime}m
            </span>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formatted}>
              <defs>
                <linearGradient id="timeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border, #e5e7eb)"
                opacity={0.4}
              />
              <XAxis
                dataKey="date"
                tick={{
                  fontSize: 11,
                  fill: "var(--color-text-tertiary, #9ca3af)",
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{
                  fontSize: 11,
                  fill: "var(--color-text-tertiary, #9ca3af)",
                }}
                axisLine={false}
                tickLine={false}
                unit="m"
              />
              <Tooltip content={<CustomTooltip />} />
              {/* Average line */}
              {avgAll > 0 && (
                <Line
                  type="monotone"
                  dataKey={() => avgAll}
                  name="Average"
                  stroke="#a78bfa"
                  strokeWidth={1}
                  strokeDasharray="6 4"
                  dot={false}
                  activeDot={false}
                />
              )}
              <Area
                type="monotone"
                dataKey="avgTime"
                name={labels.avgTime}
                stroke="#8b5cf6"
                strokeWidth={2.5}
                fill="url(#timeGrad)"
                dot={{ fill: "#8b5cf6", r: 3, strokeWidth: 0 }}
                activeDot={{
                  r: 6,
                  stroke: "#8b5cf6",
                  strokeWidth: 2,
                  fill: "#fff",
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────── Daily Stats Table ─────────────────────── */
function DailyStatsTable({
  data,
  title,
  subtitle,
  labels,
}: {
  data: any[];
  title: string;
  subtitle: string;
  labels: {
    date: string;
    tickets: string;
    served: string;
    skipped: string;
    avgTime: string;
    rate: string;
  };
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="card overflow-hidden"
    >
      <div className="border-b border-surface-secondary/60 p-6 pb-4">
        <SectionHeader icon={CalendarDays} title={title} subtitle={subtitle} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-secondary/30">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                {labels.date}
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                {labels.tickets}
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                {labels.served}
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                {labels.skipped}
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                {labels.avgTime}
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                {labels.rate}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-secondary/40">
            {(Array.isArray(data) ? data : []).map((day: any, i: number) => {
              const rate =
                day.totalTickets > 0
                  ? ((day.totalServed / day.totalTickets) * 100).toFixed(0)
                  : "0";
              return (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.42 + i * 0.02 }}
                  className="transition-colors hover:bg-surface-secondary/20"
                >
                  <td className="px-6 py-3 font-medium text-content-primary">
                    {new Date(day.date).toLocaleDateString("en", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-content-primary">
                    {day.totalTickets}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-status-success">
                    {day.totalServed}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-status-error">
                    {day.totalSkipped}
                  </td>
                  <td className="px-4 py-3 text-right text-content-secondary">
                    {day.avgServiceTime
                      ? `${Math.round(day.avgServiceTime / 60)}m`
                      : "–"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        parseFloat(rate) >= 80
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : parseFloat(rate) >= 60
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {rate}%
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ═══════════════ MAIN ANALYTICS PAGE ══════════════════════════════
   ═══════════════════════════════════════════════════════════════════ */
export default function AnalyticsPage() {
  const t = useTranslations("analytics");
  const td = useTranslations("dashboard");
  const tc = useTranslations("common");
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null,
  });

  // Data states
  const [summary, setSummary] = useState<any>(null);
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [queueStats, setQueueStats] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [queueNames, setQueueNames] = useState<Record<string, string>>({});
  const [employeeNames, setEmployeeNames] = useState<Record<string, string>>(
    {},
  );

  /* ── Build params from date range ─────────────────── */
  const buildParams = useCallback(() => {
    const params: any = {};
    if (dateRange.startDate) params.startDate = dateRange.startDate;
    if (dateRange.endDate) params.endDate = dateRange.endDate;
    return params;
  }, [dateRange]);

  const buildRangeParams = useCallback(() => {
    const start =
      dateRange.startDate ||
      new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
    const end =
      dateRange.endDate || new Date().toISOString().split("T")[0];
    return { startDate: start, endDate: end, tenantId: user?.tenantId || "" };
  }, [dateRange, user?.tenantId]);

  /* ── Load all analytics data ─────────────────────── */
  const loadAnalytics = useCallback(async () => {
    if (!token || !user?.tenantId) return;

    setLoading(true);
    try {
      const summaryParams = buildParams();
      const rangeParams = buildRangeParams();

      const [summaryData, dailyData, queueData, empData] = await Promise.all([
        api.analytics.dashboardSummary(summaryParams, token),
        api.analytics.daily(rangeParams, token),
        api.analytics.queues(rangeParams, token),
        api.analytics.employeePerformance(rangeParams, token),
      ]);

      setSummary(summaryData);
      setDailyStats(Array.isArray(dailyData) ? dailyData : []);
      setQueueStats(Array.isArray(queueData) ? queueData : []);
      setEmployees(Array.isArray(empData) ? empData : []);

      // Load queue & employee names in parallel
      try {
        const [queues, empList] = await Promise.all([
          api.queues.list({ tenantId: user.tenantId }),
          api.employees.list({ tenantId: user.tenantId }, token),
        ]);

        const qNames: Record<string, string> = {};
        for (const q of Array.isArray(queues) ? queues : []) {
          qNames[q._id] = q.name;
        }
        setQueueNames(qNames);

        const eNames: Record<string, string> = {};
        for (const e of Array.isArray(empList) ? empList : []) {
          eNames[e._id] = `${e.firstName} ${e.lastName}`;
        }
        setEmployeeNames(eNames);
      } catch {
        /* names are nice-to-have */
      }
    } catch (err) {
      console.error("Analytics load failed:", err);
    } finally {
      setLoading(false);
    }
  }, [token, user?.tenantId, buildParams, buildRangeParams]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(loadAnalytics, 120_000);
    return () => clearInterval(interval);
  }, [loadAnalytics]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  /* ── Derived data ────────────────────────────────── */
  const today = summary?.today || {
    totalTickets: 0,
    totalServed: 0,
    totalSkipped: 0,
    totalWaiting: 0,
    avgServiceTime: 0,
  };

  const yesterday = summary?.yesterday || {
    totalTickets: 0,
    totalServed: 0,
    totalSkipped: 0,
    avgServiceTime: 0,
  };

  const weeklyTrend = summary?.weeklyTrend || [];
  const peakHours = summary?.peakHours || [];
  const completionRate = summary?.completionRate || {
    completed: 0,
    skipped: 0,
    total: 0,
  };

  const enrichedEmployees = employees.map((e: any) => ({
    ...e,
    name: employeeNames[e.staffId] || undefined,
  }));

  const sparklines = useMemo(() => {
    if (!weeklyTrend.length) return {};
    return {
      tickets: weeklyTrend.map((d: any) => d.totalTickets),
      served: weeklyTrend.map((d: any) => d.totalServed),
      skipped: weeklyTrend.map((d: any) => d.totalSkipped),
      waiting: weeklyTrend.map((d: any) =>
        Math.max(0, d.totalTickets - d.totalServed - d.totalSkipped),
      ),
    };
  }, [weeklyTrend]);

  /* ── Date Picker labels ──────────────────────────── */
  const datePickerLabels = {
    allTime: td("allTime"),
    today: td("dateToday"),
    yesterday: td("dateYesterday"),
    last7Days: td("last7Days"),
    last30Days: td("last30Days"),
    last90Days: td("last90Days"),
    customRange: td("customRange"),
    from: td("dateFrom"),
    to: td("dateTo"),
    apply: td("dateApply"),
    clear: td("dateClear"),
  };

  const isDateFiltered = !!(dateRange.startDate && dateRange.endDate);

  /* ── RENDER ──────────────────────────────────────── */
  return (
    <div className="space-y-6 pb-12">
      {/* ═══ Page Header ═══ */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-primary to-accent-secondary shadow-sm">
              <BarChart3 size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-content-primary">
                {t("title")}
              </h1>
              <p className="text-sm text-content-tertiary">
                {isDateFiltered
                  ? `${dateRange.startDate} – ${dateRange.endDate}`
                  : t("subtitle")}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            labels={datePickerLabels}
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-secondary text-content-secondary transition-colors hover:bg-surface-secondary/80 disabled:opacity-50"
          >
            <RefreshCcw
              size={15}
              className={refreshing ? "animate-spin" : ""}
            />
          </motion.button>
        </div>
      </div>

      {/* ═══ Loading State ═══ */}
      {loading && !summary && (
        <div className="flex h-60 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
            <p className="text-sm text-content-tertiary">{tc("loading")}</p>
          </div>
        </div>
      )}

      {/* ═══ KPI Cards ═══ */}
      {summary && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <KpiCard
              title={td("totalTickets")}
              value={today.totalTickets}
              previousValue={yesterday.totalTickets}
              icon={Ticket}
              gradient="from-blue-500 to-cyan-500"
              color="#3b82f6"
              index={0}
              sparklineData={sparklines.tickets}
            />
            <KpiCard
              title={td("totalServed")}
              value={today.totalServed}
              previousValue={yesterday.totalServed}
              icon={CheckCircle2}
              gradient="from-emerald-500 to-teal-500"
              color="#10b981"
              index={1}
              sparklineData={sparklines.served}
            />
            <KpiCard
              title={td("totalSkipped")}
              value={today.totalSkipped}
              previousValue={yesterday.totalSkipped}
              icon={SkipForward}
              gradient="from-rose-500 to-pink-500"
              color="#f43f5e"
              index={2}
              sparklineData={sparklines.skipped}
            />
            <KpiCard
              title={td("totalWaiting")}
              value={today.totalWaiting}
              icon={Clock}
              gradient="from-amber-500 to-orange-500"
              color="#f59e0b"
              index={3}
              sparklineData={sparklines.waiting}
            />
            <KpiCard
              title={td("avgServiceTime")}
              value={
                today.avgServiceTime
                  ? Math.round(today.avgServiceTime / 60)
                  : 0
              }
              previousValue={
                yesterday.avgServiceTime
                  ? Math.round(yesterday.avgServiceTime / 60)
                  : undefined
              }
              icon={Timer}
              gradient="from-violet-500 to-purple-500"
              color="#8b5cf6"
              index={4}
              suffix="min"
            />
          </div>

          {/* ═══ Generated vs Served Dynamics ═══ */}
          <TicketDynamicsChart
            data={weeklyTrend}
            title={t("ticketDynamics")}
            subtitle={t("ticketDynamicsDesc")}
            labels={{
              generated: t("generated"),
              served: t("served"),
              skipped: t("skipped"),
              gap: t("gap"),
            }}
          />

          {/* ═══ Customer Engagement + Customer Dynamics row ═══ */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <CustomerEngagementWidget
              data={weeklyTrend}
              title={t("customerEngagement")}
              subtitle={t("customerEngagementDesc")}
              labels={{
                returning: t("returning"),
                satisfaction: t("satisfaction"),
                engagement: t("engagementScore"),
                completionTrend: t("completionTrend"),
                daily: t("dailyAvgTickets"),
              }}
            />
            <CompletionFunnelWidget
              completionRate={completionRate}
              title={t("completionFunnel")}
              labels={{
                generated: t("generated"),
                served: t("served"),
                skipped: t("skipped"),
                waiting: td("totalWaiting"),
                conversionRate: t("conversionRate"),
              }}
            />
          </div>

          {/* ═══ Periodical Customer Dynamics ═══ */}
          <CustomerDynamicsChart
            data={weeklyTrend}
            title={t("customerDynamics")}
            subtitle={t("customerDynamicsDesc")}
            labels={{
              volume: t("ticketVolume"),
              avgTime: t("avgServiceTime"),
              trend: t("trend"),
              growth: t("growth"),
              decline: t("decline"),
              stable: t("stable"),
              ticketsPerDay: t("ticketsPerDay"),
            }}
          />

          {/* ═══ Peak Hours + Service Time Distribution row ═══ */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <PeakHoursHeatmap
              data={peakHours}
              title={t("peakHours")}
              subtitle={t("peakHoursDesc")}
              labels={{
                hour: t("hour"),
                tickets: t("tickets"),
                peak: t("peak"),
                quiet: t("quiet"),
              }}
            />
            <ServiceTimeDistribution
              data={weeklyTrend}
              title={t("serviceTimeDistribution")}
              subtitle={t("serviceTimeDistributionDesc")}
              labels={{
                avgTime: t("avgServiceTime"),
                min: t("minimum"),
                max: t("maximum"),
                trend: t("trend"),
              }}
            />
          </div>

          {/* ═══ Queue Performance + Employee Leaderboard row ═══ */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <QueuePerformanceWidget
              queueStats={queueStats}
              queueNames={queueNames}
              title={t("queuePerformance")}
              subtitle={t("queuePerformanceDesc")}
              labels={{
                queue: t("queue"),
                created: t("created"),
                completed: t("completed"),
                skipped: t("skipped"),
                total: t("total"),
                rate: t("successRate"),
              }}
            />
            <EmployeeLeaderboard
              data={enrichedEmployees}
              title={t("employeeLeaderboard")}
              subtitle={t("employeeLeaderboardDesc")}
              labels={{
                employee: t("employee"),
                served: t("served"),
                skipped: t("skipped"),
                efficiency: t("efficiency"),
                noData: t("noEmployeeData"),
              }}
            />
          </div>

          {/* ═══ Daily Breakdown Table ═══ */}
          <DailyStatsTable
            data={dailyStats}
            title={t("dailyBreakdown")}
            subtitle={t("dailyBreakdownDesc")}
            labels={{
              date: t("dateRange"),
              tickets: td("totalTickets"),
              served: td("totalServed"),
              skipped: td("totalSkipped"),
              avgTime: td("avgServiceTime"),
              rate: t("successRate"),
            }}
          />
        </>
      )}
    </div>
  );
}
