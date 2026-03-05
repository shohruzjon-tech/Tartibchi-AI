import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";

import { useTheme } from "@/src/hooks/useTheme";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { addAlert } from "@/src/store/slices/alertSlice";
import { clearStaffAuth } from "@/src/store/slices/staffSlice";
import {
  setActiveTicket,
  updateTicketStatus,
  clearActiveTicket,
} from "@/src/store/slices/ticketSlice";
import { TicketStatus } from "@/src/types";
import { SecureStorage } from "@/src/services/secure-storage";
import { api } from "@/src/services/api";
import {
  connectSocket,
  disconnectSocket,
  getSocket,
  joinCounter,
} from "@/src/services/socket";
import { useSocketNotifications } from "@/src/hooks/useNotifications";
import {
  Button,
  Card,
  Badge,
  ConfirmDialog,
  BottomSheet,
  LoadingOverlay,
} from "@/src/components/ui";
import {
  FontSize,
  FontWeight,
  Spacing,
  BorderRadius,
  Shadow,
} from "@/src/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type TicketAction =
  | "next"
  | "recall"
  | "skip"
  | "startServing"
  | "done"
  | "transfer";

export default function WorkstationScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { staff, token: staffToken } = useAppSelector((s) => s.staff);
  const activeTicket = useAppSelector((s) => s.ticket.activeTicket);

  const [counter, setCounter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<TicketAction | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [availableCounters, setAvailableCounters] = useState<any[]>([]);
  const [showLogout, setShowLogout] = useState(false);
  const [serviceTimer, setServiceTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { notifyTicketCalled, notifySystem } = useSocketNotifications();

  // Pulsing animation for active ticket
  const pulseAnim = useSharedValue(1);
  useEffect(() => {
    if (activeTicket) {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1.03, {
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else {
      pulseAnim.value = 1;
    }
  }, [activeTicket]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  // Service timer
  useEffect(() => {
    if (activeTicket?.status === "SERVING") {
      timerRef.current = setInterval(() => setServiceTimer((p) => p + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setServiceTimer(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeTicket?.status]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const fetchCounter = useCallback(async () => {
    try {
      if (!staff?.counterId) return;
      const data = await api.staffCounter.get(staff!.counterId);
      setCounter(data);
      if (data.currentTicket) {
        dispatch(setActiveTicket(data.currentTicket));
      } else {
        dispatch(clearActiveTicket());
      }
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
  }, [staff?.counterId]);

  useEffect(() => {
    fetchCounter();
    // WebSocket
    if (staff?.counterId) {
      const socket = connectSocket();
      const tenantId = staff?.tenantId ?? "";
      const branchId = staff?.branchId ?? "";
      joinCounter(tenantId, branchId, staff.counterId);

      // Listen for real-time counter events
      socket.on("ticketAssigned", (data: any) => {
        if (data?.ticket) {
          dispatch(setActiveTicket(data.ticket));
          notifyTicketCalled(data.ticket.ticketNumber ?? "");
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      });

      socket.on("counterUpdate", (data: any) => {
        if (data?.counter) {
          setCounter(data.counter);
          if (data.counter.currentTicket) {
            dispatch(setActiveTicket(data.counter.currentTicket));
          } else {
            dispatch(clearActiveTicket());
          }
        }
      });

      socket.on("ticketUpdate", (data: any) => {
        if (data?.ticket?.id === activeTicket?.id) {
          dispatch(setActiveTicket(data.ticket));
        }
      });

      socket.on("systemAlert", (data: any) => {
        notifySystem(data?.title ?? "System", data?.message ?? "");
      });

      return () => {
        socket.off("ticketAssigned");
        socket.off("counterUpdate");
        socket.off("ticketUpdate");
        socket.off("systemAlert");
        disconnectSocket();
      };
    }
    return () => disconnectSocket();
  }, [fetchCounter, staff?.counterId]);

  const handleAction = async (action: TicketAction, extra?: any) => {
    try {
      setActionLoading(action);
      Haptics.impactAsync(
        action === "done"
          ? Haptics.ImpactFeedbackStyle.Heavy
          : Haptics.ImpactFeedbackStyle.Medium,
      );

      switch (action) {
        case "next":
          const nextResult = await api.staffCounter.next(staff!.counterId);
          if (nextResult) dispatch(setActiveTicket(nextResult));
          break;
        case "recall":
          await api.staffCounter.recall(staff!.counterId);
          break;
        case "skip":
          await api.staffCounter.skip(staff!.counterId);
          dispatch(clearActiveTicket());
          break;
        case "startServing":
          await api.staffCounter.startServing(staff!.counterId);
          dispatch(updateTicketStatus({ status: TicketStatus.SERVING }));
          break;
        case "done":
          await api.staffCounter.done(staff!.counterId);
          dispatch(clearActiveTicket());
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case "transfer":
          if (extra?.counterId) {
            await api.staffCounter.transfer(staff!.counterId, extra.counterId);
            dispatch(clearActiveTicket());
            setShowTransfer(false);
          }
          break;
      }

      fetchCounter();
    } catch (err: any) {
      dispatch(
        addAlert({
          type: "error",
          title: t("common.error"),
          message: err.message,
        }),
      );
    } finally {
      setActionLoading(null);
    }
  };

  const openTransfer = async () => {
    try {
      const counters = await api.counters.list({}, staffToken!);
      const list = Array.isArray(counters) ? counters : (counters?.data ?? []);
      setAvailableCounters(list.filter((c: any) => c.id !== staff?.counterId));
      setShowTransfer(true);
    } catch (err: any) {
      dispatch(
        addAlert({
          type: "error",
          title: t("common.error"),
          message: err.message,
        }),
      );
    }
  };

  const handleLogout = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await SecureStorage.clearStaffTokens();
    dispatch(clearStaffAuth());
    router.replace("/");
  };

  if (loading) return <LoadingOverlay visible />;

  const isServing = activeTicket?.status === "SERVING";
  const isCalled = activeTicket?.status === "CALLED";
  const hasTicket = !!activeTicket;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + Spacing.md },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchCounter();
            }}
            tintColor={theme.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.header}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.counterName, { color: theme.text }]}>
              {counter?.name ?? "Counter"}
            </Text>
            <Text style={[styles.staffName, { color: theme.textSecondary }]}>
              {staff?.firstName ?? "Staff"} {staff?.lastName ?? ""}
            </Text>
          </View>
          <Badge
            variant={isServing ? "success" : hasTicket ? "warning" : "default"}
            text={isServing ? "Serving" : hasTicket ? "Called" : "Idle"}
          />
          <TouchableOpacity onPress={() => setShowLogout(true)} hitSlop={12}>
            <Ionicons name="log-out-outline" size={24} color={theme.error} />
          </TouchableOpacity>
        </Animated.View>

        {/* Active Ticket Display */}
        <Animated.View
          entering={FadeInUp.delay(200).springify()}
          style={pulseStyle}
        >
          <View
            style={[
              styles.ticketDisplay,
              {
                backgroundColor: hasTicket
                  ? isServing
                    ? "#10B98115"
                    : "#F59E0B15"
                  : theme.surface,
                borderColor: hasTicket
                  ? isServing
                    ? "#10B981"
                    : "#F59E0B"
                  : theme.border,
              },
            ]}
          >
            {hasTicket ? (
              <>
                <Text
                  style={[styles.ticketLabel, { color: theme.textSecondary }]}
                >
                  {t("staffPortal.currentTicket")}
                </Text>
                <Text
                  style={[
                    styles.ticketNumber,
                    { color: isServing ? "#10B981" : "#F59E0B" },
                  ]}
                >
                  {activeTicket.displayNumber ?? activeTicket.publicId ?? "---"}
                </Text>
                {isServing && (
                  <View style={styles.timerWrap}>
                    <Ionicons name="time" size={18} color={theme.primary} />
                    <Text style={[styles.timerText, { color: theme.primary }]}>
                      {formatTimer(serviceTimer)}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <>
                <Ionicons
                  name="radio-button-off"
                  size={48}
                  color={theme.textTertiary}
                />
                <Text style={[styles.idleText, { color: theme.textTertiary }]}>
                  {t("staffPortal.noActiveTicket")}
                </Text>
              </>
            )}
          </View>
        </Animated.View>

        {/* Queue Info */}
        {counter && (
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Card title={t("staffPortal.queueInfo")} index={3}>
              <View style={styles.infoRow}>
                <InfoPill
                  label={t("dashboard.waiting")}
                  value={counter.waitingCount ?? 0}
                  color="#F59E0B"
                />
                <InfoPill
                  label={t("staffPortal.served")}
                  value={counter.servedToday ?? 0}
                  color="#10B981"
                />
                <InfoPill
                  label={t("staffPortal.skipped")}
                  value={counter.skippedToday ?? 0}
                  color="#EF4444"
                />
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Action Buttons */}
        <Animated.View
          entering={FadeInDown.delay(400).springify()}
          style={styles.actionsGrid}
        >
          {!hasTicket && (
            <ActionButton
              icon="play"
              label={t("staffPortal.callNext")}
              color="#10B981"
              onPress={() => handleAction("next")}
              loading={actionLoading === "next"}
              full
            />
          )}

          {isCalled && (
            <>
              <ActionButton
                icon="volume-high"
                label={t("staffPortal.recall")}
                color="#6366F1"
                onPress={() => handleAction("recall")}
                loading={actionLoading === "recall"}
              />
              <ActionButton
                icon="play-forward"
                label={t("staffPortal.startServing")}
                color="#10B981"
                onPress={() => handleAction("startServing")}
                loading={actionLoading === "startServing"}
              />
              <ActionButton
                icon="play-skip-forward"
                label={t("staffPortal.skip")}
                color="#EF4444"
                onPress={() => handleAction("skip")}
                loading={actionLoading === "skip"}
              />
            </>
          )}

          {isServing && (
            <>
              <ActionButton
                icon="checkmark-done"
                label={t("staffPortal.done")}
                color="#10B981"
                onPress={() => handleAction("done")}
                loading={actionLoading === "done"}
                full
              />
              <ActionButton
                icon="swap-horizontal"
                label={t("staffPortal.transfer")}
                color="#6366F1"
                onPress={openTransfer}
              />
              <ActionButton
                icon="play-skip-forward"
                label={t("staffPortal.skip")}
                color="#EF4444"
                onPress={() => handleAction("skip")}
                loading={actionLoading === "skip"}
              />
            </>
          )}
        </Animated.View>

        {/* Shift Stats */}
        <Animated.View entering={FadeInDown.delay(500).springify()}>
          <Card title={t("staffPortal.shiftStats")} index={5}>
            <View style={styles.statsRow}>
              <StatItem
                label={t("staffPortal.served")}
                value={counter?.servedToday ?? 0}
                icon="checkmark-circle"
                color="#10B981"
              />
              <StatItem
                label={t("staffPortal.skipped")}
                value={counter?.skippedToday ?? 0}
                icon="play-skip-forward"
                color="#EF4444"
              />
              <StatItem
                label={t("staffPortal.avgTime")}
                value={`${counter?.avgServiceTime ?? 0}m`}
                icon="time"
                color="#6366F1"
              />
            </View>
          </Card>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Transfer BottomSheet */}
      {showTransfer && (
        <BottomSheet visible onClose={() => setShowTransfer(false)}>
          <Text style={[styles.sheetTitle, { color: theme.text }]}>
            {t("staffPortal.transferTo")}
          </Text>
          {availableCounters.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[
                styles.transferItem,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              onPress={() => handleAction("transfer", { counterId: c.id })}
            >
              <Ionicons name="desktop" size={20} color={theme.primary} />
              <Text style={[styles.transferName, { color: theme.text }]}>
                {c.name}
              </Text>
              <Ionicons
                name="arrow-forward"
                size={18}
                color={theme.textTertiary}
              />
            </TouchableOpacity>
          ))}
        </BottomSheet>
      )}

      <ConfirmDialog
        visible={showLogout}
        title={t("staffPortal.endShift")}
        message={t("staffPortal.endShiftConfirm")}
        confirmText={t("staffPortal.endShift")}
        onConfirm={handleLogout}
        onClose={() => setShowLogout(false)}
        variant="danger"
      />
    </View>
  );
}

function ActionButton({
  icon,
  label,
  color,
  onPress,
  loading,
  full,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
  loading?: boolean;
  full?: boolean;
}) {
  const theme = useTheme();
  return (
    <TouchableOpacity
      style={[
        abStyles.btn,
        {
          backgroundColor: `${color}15`,
          borderColor: `${color}40`,
          width: full ? "100%" : "47%",
        },
        Shadow.sm,
      ]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={28} color={color} />
      <Text style={[abStyles.label, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function InfoPill({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  const theme = useTheme();
  return (
    <View style={[ipStyles.pill, { backgroundColor: `${color}12` }]}>
      <Text style={[ipStyles.value, { color }]}>{value}</Text>
      <Text style={[ipStyles.label, { color: theme.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

function StatItem({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: string;
  color: string;
}) {
  const theme = useTheme();
  return (
    <View style={siStyles.item}>
      <Ionicons name={icon as any} size={20} color={color} />
      <Text style={[siStyles.value, { color: theme.text }]}>{value}</Text>
      <Text style={[siStyles.label, { color: theme.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

const abStyles = StyleSheet.create({
  btn: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    gap: Spacing.xs,
  },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
});

const ipStyles = StyleSheet.create({
  pill: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: "center",
    gap: 4,
  },
  value: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  label: { fontSize: FontSize.xs },
});

const siStyles = StyleSheet.create({
  item: { flex: 1, alignItems: "center", gap: 4 },
  value: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  label: { fontSize: FontSize.xs, textAlign: "center" },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing["3xl"] },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  counterName: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  staffName: { fontSize: FontSize.sm },
  ticketDisplay: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["3xl"],
    borderRadius: BorderRadius["2xl"],
    borderWidth: 2,
    marginBottom: Spacing.lg,
    minHeight: 160,
  },
  ticketLabel: { fontSize: FontSize.sm, marginBottom: Spacing.xs },
  ticketNumber: { fontSize: 56, fontWeight: FontWeight.bold, letterSpacing: 2 },
  timerWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: Spacing.sm,
  },
  timerText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    fontVariant: ["tabular-nums"],
  },
  idleText: { fontSize: FontSize.md, marginTop: Spacing.md },
  infoRow: { flexDirection: "row", gap: Spacing.sm },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statsRow: { flexDirection: "row", gap: Spacing.md },
  sheetTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.lg,
  },
  transferItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  transferName: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
});
