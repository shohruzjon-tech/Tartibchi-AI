"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  Users,
  ClipboardList,
  Monitor,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Building2,
  Activity,
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
  waitingNow: number;
}

export default function ManagerDashboard() {
  const t = useTranslations("manager");
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const [stats, setStats] = useState<BranchStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!token || !user?.branchId) return;
      try {
        const [employees, services, counters, analytics] = await Promise.all([
          api.employees
            .list(
              {
                tenantId: user.tenantId,
                branchId: user.branchId,
              },
              token,
            )
            .catch(() => []),
          api.queues
            .list({
              tenantId: user.tenantId,
              branchId: user.branchId,
            })
            .catch(() => []),
          api.counters
            .list(
              {
                tenantId: user.tenantId,
                branchId: user.branchId,
              },
              token,
            )
            .catch(() => []),
          api.analytics
            .dashboardSummary({ branchId: user.branchId }, token)
            .catch(() => null),
        ]);

        const empList = Array.isArray(employees)
          ? employees
          : (employees as any)?.data || [];
        const svcList = Array.isArray(services)
          ? services
          : (services as any)?.data || [];
        const ctrList = Array.isArray(counters)
          ? counters
          : (counters as any)?.data || [];

        setStats({
          totalStaff: empList.length,
          activeStaff: empList.filter((e: any) => e.isActive).length,
          totalServices: svcList.length,
          activeServices: svcList.filter((s: any) => s.isActive).length,
          totalCounters: ctrList.length,
          activeCounters: ctrList.filter((c: any) => c.isActive).length,
          ticketsToday: analytics?.totalTickets || 0,
          avgWaitTime: analytics?.avgWaitTime || 0,
          avgServiceTime: analytics?.avgServiceTime || 0,
          servedToday: analytics?.served || 0,
          waitingNow: analytics?.waiting || 0,
        });
      } catch {
        setStats({
          totalStaff: 0,
          activeStaff: 0,
          totalServices: 0,
          activeServices: 0,
          totalCounters: 0,
          activeCounters: 0,
          ticketsToday: 0,
          avgWaitTime: 0,
          avgServiceTime: 0,
          servedToday: 0,
          waitingNow: 0,
        });
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [token, user]);

  const statCards = stats
    ? [
        {
          label: t("totalStaff"),
          value: stats.totalStaff,
          sub: `${stats.activeStaff} ${t("active")}`,
          icon: Users,
          color: "from-blue-500 to-indigo-600",
        },
        {
          label: t("totalServices"),
          value: stats.totalServices,
          sub: `${stats.activeServices} ${t("active")}`,
          icon: ClipboardList,
          color: "from-emerald-500 to-teal-600",
        },
        {
          label: t("totalCounters"),
          value: stats.totalCounters,
          sub: `${stats.activeCounters} ${t("active")}`,
          icon: Monitor,
          color: "from-violet-500 to-purple-600",
        },
        {
          label: t("ticketsToday"),
          value: stats.ticketsToday,
          sub: `${stats.servedToday} ${t("served")}`,
          icon: TrendingUp,
          color: "from-amber-500 to-orange-600",
        },
      ]
    : [];

  const quickActions = [
    {
      label: t("manageStaff"),
      href: "/manager/staff",
      icon: Users,
      desc: t("manageStaffDesc"),
    },
    {
      label: t("manageServices"),
      href: "/manager/services",
      icon: ClipboardList,
      desc: t("manageServicesDesc"),
    },
    {
      label: t("manageCounters"),
      href: "/manager/counters",
      icon: Monitor,
      desc: t("manageCountersDesc"),
    },
    {
      label: t("branchSettings"),
      href: "/manager/settings",
      icon: Building2,
      desc: t("branchSettingsDesc"),
    },
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
      <div>
        <h1 className="text-2xl font-bold text-content-primary">
          {t("dashboardTitle")}
        </h1>
        <p className="mt-1 text-sm text-content-secondary">
          {t("dashboardSubtitle")}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card p-5"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-content-secondary">{card.label}</p>
                <p className="mt-1 text-2xl font-bold text-content-primary">
                  {card.value}
                </p>
                <p className="mt-0.5 text-xs text-content-tertiary">
                  {card.sub}
                </p>
              </div>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.color}`}
              >
                <card.icon size={18} className="text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Live Status */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card flex items-center gap-4 p-5"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-status-warning/10">
              <Clock size={22} className="text-status-warning" />
            </div>
            <div>
              <p className="text-sm text-content-secondary">
                {t("avgWaitTime")}
              </p>
              <p className="text-xl font-bold text-content-primary">
                {stats.avgWaitTime}{" "}
                <span className="text-sm font-normal text-content-tertiary">
                  min
                </span>
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card flex items-center gap-4 p-5"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-status-success/10">
              <CheckCircle2 size={22} className="text-status-success" />
            </div>
            <div>
              <p className="text-sm text-content-secondary">
                {t("servedToday")}
              </p>
              <p className="text-xl font-bold text-content-primary">
                {stats.servedToday}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="card flex items-center gap-4 p-5"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-primary/10">
              <Activity size={22} className="text-accent-primary" />
            </div>
            <div>
              <p className="text-sm text-content-secondary">
                {t("waitingNow")}
              </p>
              <p className="text-xl font-bold text-content-primary">
                {stats.waitingNow}
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-content-primary">
          {t("quickActions")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {quickActions.map((action, i) => (
            <motion.div
              key={action.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
            >
              <Link
                href={action.href}
                className="group card flex items-center gap-4 p-5 transition-all hover:shadow-medium"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-primary/10">
                  <action.icon
                    size={22}
                    className="text-accent-primary transition-transform group-hover:scale-110"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-content-primary">
                    {action.label}
                  </p>
                  <p className="mt-0.5 text-xs text-content-tertiary">
                    {action.desc}
                  </p>
                </div>
                <ArrowRight
                  size={16}
                  className="text-content-tertiary transition-transform group-hover:translate-x-1"
                />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
