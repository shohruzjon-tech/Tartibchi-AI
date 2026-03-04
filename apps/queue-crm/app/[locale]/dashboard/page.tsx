"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Ticket,
  CheckCircle2,
  Clock,
  SkipForward,
  RefreshCcw,
  Calendar,
  DollarSign,
  Building2,
  Users,
} from "lucide-react";
import { api } from "../../../lib/api";
import { useAuthStore } from "../../../lib/store";
import {
  StatCard,
  WeeklyTrendChart,
  PeakHoursChart,
  CompletionRateChart,
  EmployeePerformance,
  AiInsightsWidget,
  TopQueuesChart,
  ServiceTimeChart,
  LiveStatusWidget,
  DateRangePicker,
} from "../../../components/dashboard";
import type { DateRange } from "../../../components/dashboard";

/* ── Card configs per workspace mode ──────────────────── */

const MULTI_CARDS = [
  {
    key: "totalTickets",
    icon: Ticket,
    gradient: "from-blue-500 to-cyan-500",
    bg: "bg-blue-500/8",
    color: "#3b82f6",
  },
  {
    key: "totalServed",
    icon: CheckCircle2,
    gradient: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-500/8",
    color: "#00c978",
  },
  {
    key: "totalWaiting",
    icon: Clock,
    gradient: "from-amber-500 to-orange-500",
    bg: "bg-amber-500/8",
    color: "#f59e0b",
  },
  {
    key: "totalSkipped",
    icon: SkipForward,
    gradient: "from-rose-500 to-pink-500",
    bg: "bg-rose-500/8",
    color: "#f43f5e",
  },
];

const SOLO_CARDS = [
  {
    key: "totalAppointments",
    icon: Calendar,
    gradient: "from-blue-500 to-cyan-500",
    bg: "bg-blue-500/8",
    color: "#3b82f6",
  },
  {
    key: "completedAppointments",
    icon: CheckCircle2,
    gradient: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-500/8",
    color: "#00c978",
  },
  {
    key: "pendingAppointments",
    icon: Clock,
    gradient: "from-amber-500 to-orange-500",
    bg: "bg-amber-500/8",
    color: "#f59e0b",
  },
  {
    key: "cancelledAppointments",
    icon: SkipForward,
    gradient: "from-rose-500 to-pink-500",
    bg: "bg-rose-500/8",
    color: "#f43f5e",
  },
];

interface DashboardSummary {
  today: {
    totalTickets: number;
    totalServed: number;
    totalSkipped: number;
    totalWaiting: number;
    avgServiceTime: number;
  };
  yesterday: {
    totalTickets: number;
    totalServed: number;
    totalSkipped: number;
    avgServiceTime: number;
  };
  weeklyTrend: Array<{
    date: string;
    totalTickets: number;
    totalServed: number;
    totalSkipped: number;
    avgServiceTime: number;
  }>;
  peakHours: Array<{ hour: number; count: number }>;
  topQueues: Array<{ _id: string; count: number; name?: string }>;
  completionRate: { completed: number; skipped: number; total: number };
}

interface AiInsightsData {
  summary: string;
  insights: string[];
  recommendations: string[];
  topPerformers: string[];
  alerts: string[];
}

interface EmployeeData {
  staffId: string;
  served: number;
  skipped: number;
  started: number;
  totalEvents: number;
  name?: string;
}

interface SoloStats {
  total: number;
  completed: number;
  pending: number;
  cancelled: number;
  noShow: number;
  inProgress: number;
  earnings: number;
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const ta = useTranslations("analytics");
  const tc = useTranslations("common");
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const isSolo = user?.tenantMode === "SOLO";

  /* ── Shared state ─────────────────────────────────── */
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null,
  });
  const [loading, setLoading] = useState(true);

  /* ── Multi-tenant state ───────────────────────────── */
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [aiInsights, setAiInsights] = useState<AiInsightsData | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [queueNames, setQueueNames] = useState<Record<string, string>>({});
  const [employeeNames, setEmployeeNames] = useState<Record<string, string>>(
    {},
  );

  /* ── Solo state ───────────────────────────────────── */
  const [soloStats, setSoloStats] = useState<SoloStats>({
    total: 0,
    completed: 0,
    pending: 0,
    cancelled: 0,
    noShow: 0,
    inProgress: 0,
    earnings: 0,
  });

  /* ── Load data: MULTI mode ────────────────────────── */
  const loadMultiDashboard = useCallback(async () => {
    if (!token || !user?.tenantId) return;
    setLoading(true);

    try {
      const summaryParams: {
        branchId?: string;
        startDate?: string;
        endDate?: string;
      } = {};
      if (dateRange.startDate) summaryParams.startDate = dateRange.startDate;
      if (dateRange.endDate) summaryParams.endDate = dateRange.endDate;

      const empParams: any = {
        startDate:
          dateRange.startDate ||
          new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0],
        endDate: dateRange.endDate || new Date().toISOString().split("T")[0],
      };

      const [summaryData, empData] = await Promise.all([
        api.analytics.dashboardSummary(summaryParams, token),
        api.analytics.employeePerformance(empParams, token),
      ]);

      setSummary(summaryData);
      setEmployees(empData);

      // Load queue names for top queues
      if (summaryData?.topQueues?.length > 0) {
        try {
          const queues = await api.queues.list({ tenantId: user.tenantId });
          const names: Record<string, string> = {};
          for (const q of Array.isArray(queues) ? queues : []) {
            names[q._id] = q.name;
          }
          setQueueNames(names);
        } catch {
          /* ignore */
        }
      }

      // Load employee names
      if (empData?.length > 0) {
        try {
          const empList = await api.employees.list(
            { tenantId: user.tenantId },
            token,
          );
          const names: Record<string, string> = {};
          for (const e of Array.isArray(empList) ? empList : []) {
            names[e._id] = `${e.firstName} ${e.lastName}`;
          }
          setEmployeeNames(names);
        } catch {
          /* ignore */
        }
      }
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, [token, user?.tenantId, dateRange]);

  /* ── Load data: SOLO mode ─────────────────────────── */
  const loadSoloDashboard = useCallback(async () => {
    if (!token) return;
    setLoading(true);

    try {
      const params: { date?: string; status?: string } = {};
      const appointments: any[] = await api.appointments.list(params, token);
      const list = Array.isArray(appointments) ? appointments : [];

      // Filter by date range if set
      const filtered = list.filter((a: any) => {
        if (!dateRange.startDate || !dateRange.endDate) return true;
        const d = (a.date || "").split("T")[0];
        return d >= dateRange.startDate! && d <= dateRange.endDate!;
      });

      const stats: SoloStats = {
        total: filtered.length,
        completed: 0,
        pending: 0,
        cancelled: 0,
        noShow: 0,
        inProgress: 0,
        earnings: 0,
      };
      for (const a of filtered) {
        switch (a.status) {
          case "COMPLETED":
            stats.completed++;
            stats.earnings += a.earnings || 0;
            break;
          case "PENDING":
          case "CONFIRMED":
            stats.pending++;
            break;
          case "CANCELLED":
            stats.cancelled++;
            break;
          case "NO_SHOW":
            stats.noShow++;
            break;
          case "IN_PROGRESS":
            stats.inProgress++;
            break;
        }
      }
      setSoloStats(stats);
    } catch (err) {
      console.error("Failed to load solo dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, [token, dateRange]);

  /* ── Dispatch loader based on mode ────────────────── */
  const loadDashboard = isSolo ? loadSoloDashboard : loadMultiDashboard;

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(loadDashboard, 60000);
    return () => clearInterval(interval);
  }, [loadDashboard]);

  // AI Insights (multi-mode only)
  const loadAiInsights = useCallback(async () => {
    if (!token || !summary) return;
    setAiLoading(true);
    try {
      const result = await api.ai.dashboardInsights(
        {
          today: summary.today,
          yesterday: summary.yesterday,
          weeklyTrend: summary.weeklyTrend,
          completionRate: summary.completionRate,
          topQueues: summary.topQueues.map((q) => ({
            ...q,
            name: queueNames[q._id] || q._id,
          })),
          employeePerformance: employees.slice(0, 5).map((e) => ({
            ...e,
            name: employeeNames[e.staffId] || e.staffId,
          })),
          peakHours: summary.peakHours.slice(0, 5),
        },
        token,
      );
      setAiInsights(result);
    } catch (err) {
      console.error("AI insights failed:", err);
    } finally {
      setAiLoading(false);
    }
  }, [token, summary, employees, queueNames, employeeNames]);

  /* ── Derived values ───────────────────────────────── */

  const today = summary?.today || {
    totalTickets: 0,
    totalServed: 0,
    totalWaiting: 0,
    totalSkipped: 0,
    avgServiceTime: 0,
  };
  const yesterday = summary?.yesterday || {
    totalTickets: 0,
    totalServed: 0,
    totalSkipped: 0,
    avgServiceTime: 0,
  };

  const isDateFiltered = !!(dateRange.startDate && dateRange.endDate);

  const multiTodayValues: Record<string, number> = {
    totalTickets: today.totalTickets,
    totalServed: today.totalServed,
    totalWaiting: today.totalWaiting,
    totalSkipped: today.totalSkipped,
  };
  const multiYesterdayValues: Record<string, number> = {
    totalTickets: yesterday.totalTickets,
    totalServed: yesterday.totalServed,
    totalWaiting: 0,
    totalSkipped: yesterday.totalSkipped,
  };

  const enrichedEmployees = employees.map((e) => ({
    ...e,
    name: employeeNames[e.staffId] || undefined,
  }));

  const enrichedQueues = (summary?.topQueues || []).map((q) => ({
    ...q,
    name: queueNames[q._id] || `Queue ${q._id.slice(-4)}`,
  }));

  const soloTodayValues: Record<string, number> = {
    totalAppointments: soloStats.total,
    completedAppointments: soloStats.completed,
    pendingAppointments: soloStats.pending,
    cancelledAppointments: soloStats.cancelled + soloStats.noShow,
  };

  /* ── Date picker labels ───────────────────────────── */

  const datePickerLabels = {
    allTime: t("allTime"),
    today: t("dateToday"),
    yesterday: t("dateYesterday"),
    last7Days: t("last7Days"),
    last30Days: t("last30Days"),
    last90Days: t("last90Days"),
    customRange: t("customRange"),
    from: t("dateFrom"),
    to: t("dateTo"),
    apply: t("dateApply"),
    clear: t("dateClear"),
  };

  const headerTitle = isDateFiltered ? t("filteredStats") : t("allTimeStats");

  const headerSubtitle = isDateFiltered
    ? `${dateRange.startDate} – ${dateRange.endDate}`
    : new Date().toLocaleDateString("en", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  /* ── Render: SOLO mode ────────────────────────────── */

  if (isSolo) {
    return (
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-content-primary">
              {headerTitle}
            </h1>
            <p className="mt-1 text-sm text-content-tertiary">
              {headerSubtitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              labels={datePickerLabels}
            />
            <button
              onClick={loadDashboard}
              className="flex items-center gap-2 rounded-xl bg-surface-secondary px-4 py-2 text-sm font-medium text-content-secondary transition-colors hover:bg-surface-secondary/80"
            >
              <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Solo mode badge */}
        <div className="flex items-center gap-2 rounded-xl bg-violet-500/8 px-4 py-2">
          <Calendar size={16} className="text-violet-500" />
          <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
            {t("soloModeLabel")}
          </span>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SOLO_CARDS.map((card, i) => (
            <StatCard
              key={card.key}
              title={t(card.key)}
              value={soloTodayValues[card.key] ?? 0}
              icon={card.icon}
              gradient={card.gradient}
              bg={card.bg}
              color={card.color}
              index={i}
            />
          ))}
        </div>

        {/* Earnings card */}
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-3">
              <DollarSign size={20} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-content-tertiary">
                {t("totalEarnings")}
              </p>
              <p className="text-2xl font-bold text-content-primary">
                {soloStats.earnings.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Solo completion rate */}
        <CompletionRateChart
          completed={soloStats.completed}
          skipped={soloStats.cancelled + soloStats.noShow}
          total={soloStats.total}
          title={ta("servicePerformance")}
          labels={{
            completed: t("completedAppointments"),
            skipped: t("cancelledAppointments"),
            waiting: t("pendingAppointments"),
          }}
        />
      </div>
    );
  }

  /* ── Render: MULTI mode ───────────────────────────── */

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">
            {headerTitle}
          </h1>
          <p className="mt-1 text-sm text-content-tertiary">{headerSubtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            labels={datePickerLabels}
          />
          <button
            onClick={loadDashboard}
            className="flex items-center gap-2 rounded-xl bg-surface-secondary px-4 py-2 text-sm font-medium text-content-secondary transition-colors hover:bg-surface-secondary/80"
          >
            <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Multi-tenant mode badge */}
      <div className="flex items-center gap-2 rounded-xl bg-blue-500/8 px-4 py-2">
        <Building2 size={16} className="text-blue-500" />
        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
          {t("multiModeLabel")}
        </span>
        <span className="mx-2 text-content-tertiary">·</span>
        <Users size={14} className="text-content-tertiary" />
        <span className="text-sm text-content-tertiary">
          {enrichedEmployees.length} {t("staff")}
        </span>
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {MULTI_CARDS.map((card, i) => (
          <StatCard
            key={card.key}
            title={t(card.key)}
            value={multiTodayValues[card.key] ?? 0}
            previousValue={multiYesterdayValues[card.key]}
            icon={card.icon}
            gradient={card.gradient}
            bg={card.bg}
            color={card.color}
            index={i}
          />
        ))}
      </div>

      {/* Live status + Completion rate row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <LiveStatusWidget
          data={{
            totalWaiting: today.totalWaiting,
            totalServing: today.totalServed,
            activeCounters: 0,
            avgWaitTime: today.avgServiceTime
              ? Math.round(today.avgServiceTime / 60)
              : 0,
          }}
          labels={{
            title: t("overview"),
            live: "Live",
            waiting: t("totalWaiting"),
            serving: t("totalServed"),
            activeCounters: t("counters"),
            avgWait: t("avgServiceTime"),
          }}
        />
        <CompletionRateChart
          completed={summary?.completionRate?.completed || 0}
          skipped={summary?.completionRate?.skipped || 0}
          total={summary?.completionRate?.total || 0}
          title={ta("servicePerformance")}
          labels={{
            completed: t("totalServed"),
            skipped: t("totalSkipped"),
            waiting: t("totalWaiting"),
          }}
        />
      </div>

      {/* Weekly trend chart (full width) */}
      <WeeklyTrendChart
        data={summary?.weeklyTrend || []}
        title={ta("ticketsOverTime")}
        labels={{
          tickets: t("totalTickets"),
          served: t("totalServed"),
          skipped: t("totalSkipped"),
        }}
      />

      {/* Peak hours + Service time row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <PeakHoursChart
          data={summary?.peakHours || []}
          title={ta("peakHours")}
        />
        <ServiceTimeChart
          data={summary?.weeklyTrend || []}
          title={t("avgServiceTime")}
        />
      </div>

      {/* Top queues + Employee performance row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <TopQueuesChart data={enrichedQueues} title={ta("queueDistribution")} />
        <EmployeePerformance
          data={enrichedEmployees}
          title={ta("counterPerformance")}
          labels={{
            employee: t("staff"),
            served: t("totalServed"),
            skipped: t("totalSkipped"),
            rate: "Rate",
            noData: "No employee data for this period",
          }}
        />
      </div>

      {/* AI Insights (full width) */}
      <AiInsightsWidget
        data={aiInsights}
        loading={aiLoading}
        onRefresh={loadAiInsights}
        title="AI Insights"
        labels={{
          poweredBy: "Powered by GPT-4",
          insights: "Insights",
          recommendations: "Recommendations",
          topPerformers: "Top Performers",
          alerts: "Alerts",
          loading: "Analyzing your data with AI...",
          noData:
            "Click refresh to generate AI-powered insights from your dashboard data",
          refresh: "Generate Insights",
        }}
      />
    </div>
  );
}
