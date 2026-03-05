import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/src/hooks/useTheme";
import { useAppSelector, useAppDispatch } from "@/src/store";
import { addAlert } from "@/src/store/slices/alertSlice";
import { api } from "@/src/services/api";
import {
  connectSocket,
  disconnectSocket,
  joinBranch,
} from "@/src/services/socket";
import { useSocketNotifications } from "@/src/hooks/useNotifications";
import { StatCard, Card, Badge, LoadingOverlay } from "@/src/components/ui";
import { FloatingParticles } from "@/src/components/ui/AnimatedBackgrounds";
import {
  FontSize,
  FontWeight,
  Spacing,
  BorderRadius,
  Shadow,
} from "@/src/constants/theme";

const { width } = Dimensions.get("window");

export default function DashboardScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { user, token } = useAppSelector((s) => s.auth);
  const isSolo = user?.tenantMode === "SOLO";

  const [summary, setSummary] = React.useState<any>(null);
  const [liveStatus, setLiveStatus] = React.useState<any>(null);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const { notifyQueueUpdate, notifySystem } = useSocketNotifications();

  const fetchData = React.useCallback(async () => {
    try {
      const summaryData = await api.analytics
        .dashboardSummary({}, token!)
        .catch(() => null);
      setSummary(summaryData);
    } catch (err: any) {
      dispatch(
        addAlert({
          type: "error",
          title: t("common.error"),
          message: err.message,
        }),
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isSolo]);

  React.useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000);

    // WebSocket real-time updates
    const socket = connectSocket();
    const tenantId = user?.tenantId;
    const branchId = user?.branchId;
    if (tenantId && branchId) {
      joinBranch(tenantId, branchId);
    }

    socket.on("displayUpdate", (data: any) => {
      // Refresh data when display update is received
      fetchData();
      notifyQueueUpdate(data?.queueName ?? "Queue");
    });

    socket.on("ticketUpdate", () => {
      fetchData();
    });

    socket.on("systemAlert", (data: any) => {
      notifySystem(data?.title ?? "System", data?.message ?? "");
    });

    return () => {
      clearInterval(interval);
      socket.off("displayUpdate");
      socket.off("ticketUpdate");
      socket.off("systemAlert");
      disconnectSocket();
    };
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const statCards: Array<{
    label: string;
    value: number;
    icon: string;
    color: string;
    trend?: any;
  }> = isSolo
    ? [
        {
          label: t("dashboard.totalAppointments"),
          value: summary?.totalAppointments ?? 0,
          icon: "calendar",
          color: "#6366F1",
        },
        {
          label: t("dashboard.completed"),
          value: summary?.completed ?? 0,
          icon: "checkmark-circle",
          color: "#10B981",
        },
        {
          label: t("dashboard.pending"),
          value: summary?.pending ?? 0,
          icon: "time",
          color: "#F59E0B",
        },
        {
          label: t("dashboard.cancelled"),
          value: summary?.cancelled ?? 0,
          icon: "close-circle",
          color: "#EF4444",
        },
      ]
    : [
        {
          label: t("dashboard.totalTickets"),
          value: summary?.totalTickets ?? 0,
          icon: "ticket",
          color: "#6366F1",
          trend: summary?.ticketsTrend,
        },
        {
          label: t("dashboard.totalServed"),
          value: summary?.totalServed ?? 0,
          icon: "checkmark-done",
          color: "#10B981",
          trend: summary?.servedTrend,
        },
        {
          label: t("dashboard.totalWaiting"),
          value: summary?.totalWaiting ?? 0,
          icon: "hourglass",
          color: "#F59E0B",
          trend: summary?.waitingTrend,
        },
        {
          label: t("dashboard.totalSkipped"),
          value: summary?.totalSkipped ?? 0,
          icon: "play-skip-forward",
          color: "#EF4444",
          trend: summary?.skippedTrend,
        },
      ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LoadingOverlay visible={loading} />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + Spacing.md },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <FloatingParticles />
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.header}
        >
          <View>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>
              {t("dashboard.welcome")}
            </Text>
            <Text style={[styles.name, { color: theme.text }]}>
              {user?.firstName ?? "Admin"} 👋
            </Text>
          </View>
          <View
            style={[
              styles.modeBadge,
              { backgroundColor: `${theme.primary}15` },
            ]}
          >
            <Text style={[styles.modeText, { color: theme.primary }]}>
              {user?.tenantMode ?? "MULTI"}
            </Text>
          </View>
        </Animated.View>

        {/* Stat cards */}
        <View style={styles.statsGrid}>
          {statCards.map((s, i) => (
            <Animated.View
              key={s.label}
              entering={FadeInRight.delay(200 + i * 80).springify()}
              style={styles.statHalf}
            >
              <StatCard
                title={s.label}
                value={s.value}
                icon={s.icon as keyof typeof Ionicons.glyphMap}
                trend={s.trend}
                color={s.color}
                index={i}
              />
            </Animated.View>
          ))}
        </View>

        {/* Live Status (MULTI only) */}
        {!isSolo && liveStatus && (
          <Animated.View entering={FadeInDown.delay(500).springify()}>
            <Card title={t("dashboard.liveStatus")} index={5}>
              <View style={styles.liveGrid}>
                <LiveItem
                  label={t("dashboard.waiting")}
                  value={liveStatus.waiting ?? 0}
                  color="#F59E0B"
                  icon="hourglass"
                />
                <LiveItem
                  label={t("dashboard.serving")}
                  value={liveStatus.serving ?? 0}
                  color="#10B981"
                  icon="pulse"
                />
                <LiveItem
                  label={t("dashboard.activeCounters")}
                  value={liveStatus.activeCounters ?? 0}
                  color="#6366F1"
                  icon="desktop"
                />
                <LiveItem
                  label={t("dashboard.avgWait")}
                  value={`${liveStatus.avgWait ?? 0}m`}
                  color="#EF4444"
                  icon="time"
                />
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Earnings (SOLO only) */}
        {isSolo && summary?.earnings !== undefined && (
          <Animated.View entering={FadeInDown.delay(500).springify()}>
            <Card title={t("dashboard.earnings")} index={5}>
              <Text style={[styles.earningsValue, { color: theme.primary }]}>
                {summary.earnings?.toLocaleString() ?? 0} {t("common.currency")}
              </Text>
            </Card>
          </Animated.View>
        )}

        {/* Completion Rate */}
        <Animated.View entering={FadeInDown.delay(600).springify()}>
          <Card title={t("dashboard.completionRate")} index={6}>
            {summary && <CompletionBar summary={summary} isSolo={isSolo} />}
          </Card>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function LiveItem({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  color: string;
  icon: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.liveItem}>
      <View style={[styles.liveIconWrap, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={[styles.liveValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.liveLabel, { color: theme.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

function CompletionBar({ summary, isSolo }: { summary: any; isSolo: boolean }) {
  const theme = useTheme();
  const total = isSolo
    ? (summary.completed ?? 0) +
      (summary.cancelled ?? 0) +
      (summary.pending ?? 0)
    : (summary.totalServed ?? 0) +
      (summary.totalSkipped ?? 0) +
      (summary.totalWaiting ?? 0);
  if (total === 0)
    return (
      <Text style={{ color: theme.textTertiary, textAlign: "center" }}>
        No data
      </Text>
    );

  const segments = isSolo
    ? [
        { value: summary.completed ?? 0, color: "#10B981", label: "Completed" },
        { value: summary.cancelled ?? 0, color: "#EF4444", label: "Cancelled" },
        { value: summary.pending ?? 0, color: "#F59E0B", label: "Pending" },
      ]
    : [
        { value: summary.totalServed ?? 0, color: "#10B981", label: "Served" },
        {
          value: summary.totalSkipped ?? 0,
          color: "#EF4444",
          label: "Skipped",
        },
        {
          value: summary.totalWaiting ?? 0,
          color: "#F59E0B",
          label: "Waiting",
        },
      ];

  return (
    <View>
      <View style={styles.barRow}>
        {segments.map((seg) => (
          <View
            key={seg.label}
            style={[
              styles.barSegment,
              { backgroundColor: seg.color, flex: seg.value / total || 0 },
            ]}
          />
        ))}
      </View>
      <View style={styles.legendRow}>
        {segments.map((seg) => (
          <View key={seg.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: seg.color }]} />
            <Text style={[styles.legendText, { color: theme.textSecondary }]}>
              {seg.label} ({Math.round((seg.value / total) * 100)}%)
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing["3xl"] },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  greeting: { fontSize: FontSize.sm },
  name: { fontSize: FontSize["2xl"], fontWeight: FontWeight.bold },
  modeBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  modeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statHalf: { width: (width - Spacing.lg * 2 - Spacing.sm) / 2 },
  liveGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.md },
  liveItem: {
    width: "46%",
    alignItems: "center",
    gap: 4,
    paddingVertical: Spacing.sm,
  },
  liveIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  liveValue: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  liveLabel: { fontSize: FontSize.xs, textAlign: "center" },
  earningsValue: {
    fontSize: FontSize["3xl"],
    fontWeight: FontWeight.bold,
    textAlign: "center",
    paddingVertical: Spacing.lg,
  },
  barRow: {
    flexDirection: "row",
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
    gap: 2,
    marginBottom: Spacing.sm,
  },
  barSegment: { borderRadius: 5, minWidth: 4 },
  legendRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.md },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: FontSize.xs },
});
