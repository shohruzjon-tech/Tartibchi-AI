import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";

import { useTheme } from "@/src/hooks/useTheme";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { addAlert } from "@/src/store/slices/alertSlice";
import { api } from "@/src/services/api";
import {
  connectSocket,
  disconnectSocket,
  joinBranch,
} from "@/src/services/socket";
import { StatCard, Card, LoadingOverlay } from "@/src/components/ui";
import {
  FontSize,
  FontWeight,
  Spacing,
  BorderRadius,
  Shadow,
} from "@/src/constants/theme";

const { width } = Dimensions.get("window");

export default function ManagerOverviewScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { user, token } = useAppSelector((s) => s.auth);
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [live, setLive] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      const summaryData = await api.analytics
        .dashboardSummary({}, token!)
        .catch(() => null);
      setStats(summaryData);
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
  }, []);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 60_000);

    // WebSocket for real-time updates
    const socket = connectSocket();
    const tenantId = user?.tenantId;
    const branchId = user?.branchId;
    if (tenantId && branchId) {
      joinBranch(tenantId, branchId);
    }

    socket.on("displayUpdate", () => {
      fetchData();
    });

    socket.on("ticketUpdate", () => {
      fetchData();
    });

    return () => {
      clearInterval(iv);
      socket.off("displayUpdate");
      socket.off("ticketUpdate");
      disconnectSocket();
    };
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const resourceCards = [
    {
      label: t("manager.totalStaff"),
      value: stats?.totalStaff ?? 0,
      icon: "people",
      color: "#6366F1",
    },
    {
      label: t("manager.totalServices"),
      value: stats?.totalServices ?? 0,
      icon: "clipboard",
      color: "#10B981",
    },
    {
      label: t("manager.totalCounters"),
      value: stats?.totalCounters ?? 0,
      icon: "desktop",
      color: "#F59E0B",
    },
    {
      label: t("manager.ticketsToday"),
      value: stats?.ticketsToday ?? 0,
      icon: "ticket",
      color: "#EF4444",
    },
  ];

  const quickActions = [
    {
      label: t("manager.manageStaff"),
      icon: "people",
      route: "/(manager)/staff",
    },
    {
      label: t("manager.manageServices"),
      icon: "clipboard",
      route: "/(manager)/services",
    },
    {
      label: t("manager.manageCounters"),
      icon: "desktop",
      route: "/(manager)/counters",
    },
    {
      label: t("manager.branchSettings"),
      icon: "settings",
      route: "/(manager)/branch-settings",
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
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Text style={[styles.title, { color: theme.text }]}>
            {t("manager.branchOverview")}
          </Text>
        </Animated.View>

        {/* Resource Cards */}
        <View style={styles.grid}>
          {resourceCards.map((c, i) => (
            <Animated.View
              key={c.label}
              entering={FadeInRight.delay(200 + i * 80).springify()}
              style={styles.half}
            >
              <StatCard
                title={c.label}
                value={c.value}
                icon={c.icon as keyof typeof Ionicons.glyphMap}
                color={c.color}
                index={i}
              />
            </Animated.View>
          ))}
        </View>

        {/* Live Metrics */}
        {live && (
          <Animated.View entering={FadeInDown.delay(500).springify()}>
            <Card title={t("manager.liveMetrics")} index={5}>
              <View style={styles.liveRow}>
                <MetricPill
                  label={t("dashboard.waiting")}
                  value={live.waiting ?? 0}
                  color="#F59E0B"
                  pulse
                />
                <MetricPill
                  label={t("dashboard.serving")}
                  value={live.serving ?? 0}
                  color="#10B981"
                />
                <MetricPill
                  label={t("dashboard.avgWait")}
                  value={`${live.avgWait ?? 0}m`}
                  color="#6366F1"
                />
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Completion */}
        {stats && (
          <Animated.View entering={FadeInDown.delay(600).springify()}>
            <Card title={t("dashboard.completionRate")} index={6}>
              <CompletionVisual
                served={stats.totalServed ?? 0}
                waiting={stats.totalWaiting ?? 0}
                skipped={stats.totalSkipped ?? 0}
              />
            </Card>
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(700).springify()}>
          <Card title={t("manager.quickActions")} index={7}>
            <View style={styles.actionGrid}>
              {quickActions.map((a) => (
                <TouchableOpacity
                  key={a.route}
                  style={[
                    styles.actionBtn,
                    { backgroundColor: `${theme.primary}10` },
                  ]}
                  onPress={() => router.push(a.route as any)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={a.icon as any}
                    size={22}
                    color={theme.primary}
                  />
                  <Text style={[styles.actionLabel, { color: theme.text }]}>
                    {a.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function MetricPill({
  label,
  value,
  color,
  pulse,
}: {
  label: string;
  value: string | number;
  color: string;
  pulse?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={[mpStyles.pill, { backgroundColor: `${color}12` }]}>
      {pulse && (
        <View style={[mpStyles.pulseDot, { backgroundColor: color }]} />
      )}
      <Text style={[mpStyles.value, { color }]}>{value}</Text>
      <Text style={[mpStyles.label, { color: theme.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

function CompletionVisual({
  served,
  waiting,
  skipped,
}: {
  served: number;
  waiting: number;
  skipped: number;
}) {
  const theme = useTheme();
  const total = served + waiting + skipped;
  if (total === 0)
    return (
      <Text style={{ color: theme.textTertiary, textAlign: "center" }}>
        No data
      </Text>
    );
  return (
    <View>
      <View style={cvStyles.bar}>
        <View
          style={[
            cvStyles.seg,
            { flex: served / total, backgroundColor: "#10B981" },
          ]}
        />
        <View
          style={[
            cvStyles.seg,
            { flex: waiting / total, backgroundColor: "#F59E0B" },
          ]}
        />
        <View
          style={[
            cvStyles.seg,
            { flex: skipped / total, backgroundColor: "#EF4444" },
          ]}
        />
      </View>
      <View style={cvStyles.legend}>
        <LegendItem
          color="#10B981"
          label="Served"
          pct={Math.round((served / total) * 100)}
        />
        <LegendItem
          color="#F59E0B"
          label="Waiting"
          pct={Math.round((waiting / total) * 100)}
        />
        <LegendItem
          color="#EF4444"
          label="Skipped"
          pct={Math.round((skipped / total) * 100)}
        />
      </View>
    </View>
  );
}

function LegendItem({
  color,
  label,
  pct,
}: {
  color: string;
  label: string;
  pct: number;
}) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <View
        style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }}
      />
      <Text style={{ fontSize: FontSize.xs, color: theme.textSecondary }}>
        {label} ({pct}%)
      </Text>
    </View>
  );
}

const mpStyles = StyleSheet.create({
  pill: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: "center",
    gap: 4,
  },
  pulseDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 2 },
  value: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  label: { fontSize: FontSize.xs },
});

const cvStyles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
    gap: 2,
    marginBottom: Spacing.sm,
  },
  seg: { borderRadius: 5, minWidth: 4 },
  legend: { flexDirection: "row", gap: Spacing.lg },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing["3xl"] },
  title: {
    fontSize: FontSize["2xl"],
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.lg,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  half: { width: (width - Spacing.lg * 2 - Spacing.sm) / 2 },
  liveRow: { flexDirection: "row", gap: Spacing.sm },
  actionGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  actionBtn: {
    width: "47%",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  actionLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    textAlign: "center",
  },
});
