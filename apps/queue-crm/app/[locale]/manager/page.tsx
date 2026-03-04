"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  Users,
  ClipboardList,
  Monitor,
  TrendingUp,
  Clock,
  CheckCircle2,
  Activity,
  ArrowRight,
  Building2,
  SkipForward,
  RefreshCcw,
  Ticket,
  Sparkles,
  BarChart3,
  Zap,
} from "lucide-react";
import { Link } from "../../../i18n/navigation";
import { useAuthStore } from "../../../lib/store";
import { api } from "../../../lib/api";

interface BranchStats {
  totalStaff: number;
  activeStaff: number;
  totalServices: number;
  activeServices: number;
  totalCounters: number;
  activeCounters: number;
  ticketsToday: number;
  avgWaitTime: number;
  avgServiceTime: number;
  servedToday: number;
  skippedToday: number;
  waitingNow: number;
}

export default function ManagerDashboard() {
  const t = useTranslations("manager");
  const tc = useTranslations("common");
  const ta = useTranslations("analytics");
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const [stats, setStats] = useState<BranchStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!token || !user?.branchId) return;
    setLoading(true);
    try {
      const [employees, services, counters, analytics] = await Promise.all([
        api.employees.list({ tenantId: user.tenantId, branchId: user.branchId }, token).catch(() => []),
        api.queues.list({ tenantId: user.tenantId, branchId: user.branchId }).catch(() => []),
        api.counters.list({ tenantId: user.tenantId, branchId: user.branchId }, token).catch(() => []),
        api.analytics.dashboardSummary({ branchId: user.branchId }, token).catch(() => null),
      ]);

      const empList = Array.isArray(employees) ? employees : (employees as any)?.data || [];
      const svcList = Array.isArray(services) ? services : (services as any)?.data || [];
      const ctrList = Array.isArray(counters) ? counters : (counters as any)?.data || [];

      const today = analytics?.today || analytics || {};
      setStats({
        totalStaff: empList.length,
        activeStaff: empList.filter((e: any) => e.isActive).length,
        totalServices: svcList.length,
        activeServices: svcList.filter((s: any) => s.isActive).length,
        totalCounters: ctrList.length,
        activeCounters: ctrList.filter((c: any) => c.isActive).length,
        ticketsToday: today.totalTickets || 0,
        avgWaitTime: today.avgWaitTime || 0,
        avgServiceTime: today.avgServiceTime ? Math.round(today.avgServiceTime / 60) : 0,
        servedToday: today.totalServed || today.served || 0,
        skippedToday: today.totalSkipped || 0,
        waitingNow: today.totalWaiting || today.waiting || 0,
      });
    } catch {
      setStats({
        totalStaff: 0, activeStaff: 0, totalServices: 0, activeServices: 0,
        totalCounters: 0, activeCounters: 0, ticketsToday: 0, avgWaitTime: 0,
        avgServiceTime: 0, servedToday: 0, skippedToday: 0, waitingNow: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [token, user?.tenantId, user?.branchId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const resourceCards = stats ? [
    { label: t("totalStaff"), value: stats.totalStaff, sub: `${stats.activeStaff} ${t("active")}`, icon: Users, gradient: "from-blue-500 to-indigo-600", iconBg: "bg-blue-500/10" },
    { label: t("totalServices"), value: stats.totalServices, sub: `${stats.activeServices} ${t("active")}`, icon: ClipboardList, gradient: "from-emerald-500 to-teal-600", iconBg: "bg-emerald-500/10" },
    { label: t("totalCounters"), value: stats.totalCounters, sub: `${stats.activeCounters} ${t("active")}`, icon: Monitor, gradient: "from-violet-500 to-purple-600", iconBg: "bg-violet-500/10" },
    { label: t("ticketsToday"), value: stats.ticketsToday, sub: `${stats.servedToday} ${t("served")}`, icon: TrendingUp, gradient: "from-amber-500 to-orange-600", iconBg: "bg-amber-500/10" },
  ] : [];

  const liveMetrics = stats ? [
    { label: t("waitingNow"), value: stats.waitingNow, icon: Clock, color: "text-status-warning", bg: "bg-status-warning/10", pulse: stats.waitingNow > 0 },
    { label: t("servedToday"), value: stats.servedToday, icon: CheckCircle2, color: "text-status-success", bg: "bg-status-success/10", pulse: false },
    { label: t("avgWaitTime"), value: stats.avgWaitTime, unit: "min", icon: Activity, color: "text-accent-primary", bg: "bg-accent-primary/10", pulse: false },
    { label: t("avgServiceTimeLabel"), value: stats.avgServiceTime, unit: "min", icon: Zap, color: "text-status-info", bg: "bg-status-info/10", pulse: false },
  ] : [];

  const quickActions = [
    { label: t("manageStaff"), href: "/manager/staff", icon: Users, desc: t("manageStaffDesc") },
    { label: t("manageServices"), href: "/manager/services", icon: ClipboardList, desc: t("manageServicesDesc") },
    { label: t("manageCounters"), href: "/manager/counters", icon: Monitor, desc: t("manageCountersDesc") },
    { label: t("branchSettings"), href: "/manager/settings", icon: Building2, desc: t("branchSettingsDesc") },
  ];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">{t("dashboardTitle")}</h1>
          <p className="mt-1 text-sm text-content-secondary">{t("dashboardSubtitle")}</p>
        </div>
        <button onClick={fetchStats} disabled={loading} className="flex items-center gap-2 rounded-xl bg-surface-secondary px-4 py-2.5 text-sm font-medium text-content-secondary transition-colors hover:bg-surface-tertiary">
          <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
          {tc("refresh")}
        </button>
      </div>

      {/* Resource Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {resourceCards.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="group relative overflow-hidden rounded-2xl bg-surface-elevated p-5 shadow-soft transition-all hover:shadow-medium hover:-translate-y-0.5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-content-secondary">{card.label}</p>
                <p className="mt-1.5 text-3xl font-bold text-content-primary">{card.value}</p>
                <p className="mt-1 text-xs text-content-tertiary">{card.sub}</p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} shadow-sm`}>
                <card.icon size={20} className="text-white" />
              </div>
            </div>
            <div className={`absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r ${card.gradient} opacity-0 transition-opacity group-hover:opacity-100`} />
          </motion.div>
        ))}
      </div>

      {/* Live Metrics */}
      {stats && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-status-success" />
            </div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-content-tertiary">{t("liveStatus")}</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {liveMetrics.map((metric, i) => (
              <motion.div key={metric.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.06 }}
                className="flex items-center gap-4 rounded-2xl bg-surface-elevated p-4 shadow-soft">
                <div className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${metric.bg}`}>
                  <metric.icon size={22} className={metric.color} />
                  {metric.pulse && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-warning opacity-75" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-status-warning" />
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm text-content-secondary">{metric.label}</p>
                  <p className="text-2xl font-bold text-content-primary">
                    {metric.value}
                    {metric.unit && <span className="ml-1 text-sm font-normal text-content-tertiary">{metric.unit}</span>}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Completion Overview */}
      {stats && stats.ticketsToday > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="rounded-2xl bg-surface-elevated p-5 shadow-soft">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-content-tertiary">{ta("servicePerformance")}</h3>
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-content-secondary">{t("completionRate")}</span>
                <span className="font-bold text-content-primary">{stats.ticketsToday > 0 ? Math.round((stats.servedToday / stats.ticketsToday) * 100) : 0}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-surface-tertiary">
                <div className="flex h-full">
                  <div className="bg-status-success transition-all duration-500" style={{ width: `${stats.ticketsToday > 0 ? (stats.servedToday / stats.ticketsToday) * 100 : 0}%` }} />
                  <div className="bg-status-warning transition-all duration-500" style={{ width: `${stats.ticketsToday > 0 ? (stats.waitingNow / stats.ticketsToday) * 100 : 0}%` }} />
                  <div className="bg-status-error transition-all duration-500" style={{ width: `${stats.ticketsToday > 0 ? (stats.skippedToday / stats.ticketsToday) * 100 : 0}%` }} />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-xs">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-status-success" />{t("served")} ({stats.servedToday})</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-status-warning" />{t("waitingNow")} ({stats.waitingNow})</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-status-error" />{t("skipped")} ({stats.skippedToday})</span>
              </div>
            </div>
            <div className="hidden sm:flex flex-col items-center gap-1 rounded-2xl bg-surface-secondary/60 p-4">
              <Ticket size={20} className="text-accent-primary" />
              <p className="text-2xl font-bold text-content-primary">{stats.ticketsToday}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-content-tertiary">{t("ticketsToday")}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-content-tertiary">
          <Sparkles size={14} />
          {t("quickActions")}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {quickActions.map((action, i) => (
            <motion.div key={action.href} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.08 }}>
              <Link href={action.href} className="group flex items-center gap-4 rounded-2xl bg-surface-elevated p-5 shadow-soft transition-all hover:shadow-medium hover:-translate-y-0.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-primary/10 transition-colors group-hover:bg-accent-primary/15">
                  <action.icon size={22} className="text-accent-primary transition-transform group-hover:scale-110" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-content-primary">{action.label}</p>
                  <p className="mt-0.5 text-xs text-content-tertiary truncate">{action.desc}</p>
                </div>
                <ArrowRight size={16} className="shrink-0 text-content-tertiary transition-transform group-hover:translate-x-1 group-hover:text-accent-primary" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
