"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { api } from "../../../../lib/api";
import { useAuthStore } from "../../../../lib/store";

export default function AnalyticsPage() {
  const t = useTranslations("analytics");
  const td = useTranslations("dashboard");
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const [stats, setStats] = useState<any[]>([]);
  const [peakHours, setPeakHours] = useState<any[]>([]);
  const [range, setRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  });

  useEffect(() => {
    if (!token || !user?.tenantId) return;
    const params = { ...range, tenantId: user.tenantId };
    api.analytics.daily(params, token).then(setStats).catch(console.error);
    api.analytics
      .peakHours(params, token)
      .then(setPeakHours)
      .catch(console.error);
  }, [token, user?.tenantId, range]);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-content-primary">
          {t("title")}
        </h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl bg-surface-secondary p-1">
            <div className="flex items-center gap-2 rounded-lg bg-surface-elevated px-3 py-1.5 shadow-soft">
              <Calendar size={14} className="text-content-tertiary" />
              <input
                type="date"
                value={range.startDate}
                onChange={(e) =>
                  setRange({ ...range, startDate: e.target.value })
                }
                className="bg-transparent text-sm text-content-primary outline-none"
              />
            </div>
            <span className="text-content-tertiary">–</span>
            <div className="flex items-center gap-2 rounded-lg bg-surface-elevated px-3 py-1.5 shadow-soft">
              <input
                type="date"
                value={range.endDate}
                onChange={(e) =>
                  setRange({ ...range, endDate: e.target.value })
                }
                className="bg-transparent text-sm text-content-primary outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Daily Stats Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card mb-8 overflow-hidden"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-secondary/50">
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                {t("dateRange")}
              </th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                {td("totalTickets")}
              </th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                {td("totalServed")}
              </th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                {td("totalSkipped")}
              </th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                {td("avgServiceTime")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-secondary">
            {(Array.isArray(stats) ? stats : []).map((day: any, i: number) => (
              <motion.tr
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="transition-colors hover:bg-surface-secondary/30"
              >
                <td className="px-5 py-3.5 font-medium text-content-primary">
                  {day.date}
                </td>
                <td className="px-5 py-3.5 text-right text-content-primary">
                  {day.totalTickets}
                </td>
                <td className="px-5 py-3.5 text-right text-status-success">
                  {day.totalServed}
                </td>
                <td className="px-5 py-3.5 text-right text-status-error">
                  {day.totalSkipped}
                </td>
                <td className="px-5 py-3.5 text-right text-content-primary">
                  {day.avgServiceTime
                    ? `${Math.round(day.avgServiceTime / 60)}m`
                    : "–"}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Peak Hours */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-6"
      >
        <h2 className="mb-6 text-lg font-semibold text-content-primary">
          {t("peakHours")}
        </h2>
        <div className="flex items-end gap-1.5">
          {Array.from({ length: 24 }, (_, hour) => {
            const data = (Array.isArray(peakHours) ? peakHours : []).find(
              (p: any) => p.hour === hour,
            );
            const count = data?.count || 0;
            const maxCount = Math.max(
              ...(Array.isArray(peakHours) ? peakHours : []).map(
                (p: any) => p.count || 0,
              ),
              1,
            );
            const height = Math.max((count / maxCount) * 120, 4);
            return (
              <div
                key={hour}
                className="group flex flex-1 flex-col items-center"
              >
                <div className="relative">
                  <motion.div
                    initial={{ height: 4 }}
                    animate={{ height }}
                    transition={{ delay: hour * 0.02, duration: 0.4 }}
                    className="w-full rounded-t-md bg-gradient-to-t from-accent-primary to-accent-secondary opacity-80 transition-opacity group-hover:opacity-100"
                    title={`${hour}:00 - ${count} tickets`}
                    style={{ minWidth: "100%" }}
                  />
                </div>
                <span className="mt-2 text-[10px] text-content-tertiary">
                  {hour}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
