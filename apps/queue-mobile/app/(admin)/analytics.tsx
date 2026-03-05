import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { LineChart, PieChart, BarChart } from "react-native-chart-kit";

import { useTheme } from "@/src/hooks/useTheme";
import { useAppSelector, useAppDispatch } from "@/src/store";
import { addAlert } from "@/src/store/slices/alertSlice";
import { api } from "@/src/services/api";
import { Card, LoadingOverlay } from "@/src/components/ui";
import {
  FontSize,
  FontWeight,
  Spacing,
  BorderRadius,
} from "@/src/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - Spacing.lg * 2 - Spacing.xl * 2;

export default function AnalyticsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { user, token } = useAppSelector((s) => s.auth);
  const isSolo = user?.tenantMode === "SOLO";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [daily, setDaily] = useState<any>(null);
  const [peakHours, setPeakHours] = useState<any[]>([]);
  const [queueStats, setQueueStats] = useState<any[]>([]);
  const [employeePerf, setEmployeePerf] = useState<any[]>([]);

  const chartConfig = {
    backgroundGradientFrom: theme.card,
    backgroundGradientTo: theme.card,
    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
    labelColor: () => theme.textSecondary,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForDots: { r: "4", strokeWidth: "2", stroke: theme.primary },
  };

  const fetchData = useCallback(async () => {
    try {
      const params = { period: "7d" };
      const [dailyData, peakData, queueData, empData] = await Promise.all([
        api.analytics.daily(params, token!).catch(() => null),
        api.analytics.peakHours(params, token!).catch(() => null),
        api.analytics.queues(params, token!).catch(() => []),
        api.analytics.employeePerformance(params, token!).catch(() => []),
      ]);
      setDaily(dailyData);
      setPeakHours(peakData ?? []);
      setQueueStats(queueData ?? []);
      setEmployeePerf(empData ?? []);
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
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const weeklyData = daily?.daily
    ? {
        labels: daily.daily.slice(-7).map((d: any) => d.date?.slice(5) ?? ""),
        datasets: [
          {
            data: daily.daily.slice(-7).map((d: any) => d.total ?? 0),
            color: () => "#6366F1",
            strokeWidth: 2,
          },
          {
            data: daily.daily.slice(-7).map((d: any) => d.served ?? 0),
            color: () => "#10B981",
            strokeWidth: 2,
          },
        ],
        legend: [t("analytics.tickets"), t("analytics.served")],
      }
    : null;

  const peakData =
    peakHours.length > 0
      ? {
          labels: peakHours.map((h: any) => `${h.hour ?? ""}h`),
          datasets: [{ data: peakHours.map((h: any) => h.count ?? 0) }],
        }
      : null;

  const topQueues = queueStats.slice(0, 5);
  const pieData = topQueues.map((q: any, i: number) => ({
    name: q.name ?? `Q${i + 1}`,
    count: q.totalTickets ?? 0,
    color: ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"][i % 5],
    legendFontColor: theme.textSecondary,
    legendFontSize: 11,
  }));

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
            {t("sidebar.analytics")}
          </Text>
        </Animated.View>

        {/* Weekly Trend */}
        {weeklyData && (
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Card title={t("analytics.weeklyTrend")} index={1}>
              <LineChart
                data={weeklyData}
                width={CHART_WIDTH}
                height={200}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                withInnerLines={false}
                withOuterLines={false}
              />
            </Card>
          </Animated.View>
        )}

        {/* Peak Hours */}
        {peakData && (
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Card title={t("analytics.peakHours")} index={2}>
              <BarChart
                data={peakData}
                width={CHART_WIDTH}
                height={200}
                chartConfig={{
                  ...chartConfig,
                  color: (o = 1) => `rgba(99, 102, 241, ${o})`,
                }}
                style={styles.chart}
                showValuesOnTopOfBars
                fromZero
                yAxisLabel=""
                yAxisSuffix=""
              />
            </Card>
          </Animated.View>
        )}

        {/* Top Queues */}
        {pieData.length > 0 && (
          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <Card title={t("analytics.topQueues")} index={3}>
              <PieChart
                data={pieData}
                width={CHART_WIDTH}
                height={180}
                chartConfig={chartConfig}
                accessor="count"
                backgroundColor="transparent"
                paddingLeft="0"
                center={[0, 0]}
              />
            </Card>
          </Animated.View>
        )}

        {/* Employee Performance */}
        {employeePerf.length > 0 && !isSolo && (
          <Animated.View entering={FadeInDown.delay(500).springify()}>
            <Card title={t("analytics.employeePerformance")} index={4}>
              {employeePerf.slice(0, 5).map((emp: any, i: number) => (
                <View
                  key={emp.id ?? i}
                  style={[styles.empRow, { borderBottomColor: theme.border }]}
                >
                  <View
                    style={[
                      styles.empRank,
                      { backgroundColor: `${theme.primary}15` },
                    ]}
                  >
                    <Text
                      style={[styles.empRankText, { color: theme.primary }]}
                    >
                      #{i + 1}
                    </Text>
                  </View>
                  <View style={styles.empInfo}>
                    <Text style={[styles.empName, { color: theme.text }]}>
                      {emp.name ?? "Staff"}
                    </Text>
                    <Text
                      style={[styles.empMeta, { color: theme.textTertiary }]}
                    >
                      {emp.served ?? 0} served · avg {emp.avgServiceTime ?? 0}m
                    </Text>
                  </View>
                  <Text style={[styles.empScore, { color: theme.primary }]}>
                    {emp.score ?? 0}%
                  </Text>
                </View>
              ))}
            </Card>
          </Animated.View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing["3xl"] },
  title: {
    fontSize: FontSize["2xl"],
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.lg,
  },
  chart: { borderRadius: BorderRadius.lg, marginTop: Spacing.sm },
  empRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  empRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  empRankText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  empInfo: { flex: 1 },
  empName: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  empMeta: { fontSize: FontSize.xs, marginTop: 2 },
  empScore: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
});
