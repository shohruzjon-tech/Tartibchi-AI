import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Switch,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/src/hooks/useTheme";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { addAlert } from "@/src/store/slices/alertSlice";
import { api } from "@/src/services/api";
import { Card, Button, LoadingOverlay } from "@/src/components/ui";
import {
  FontSize,
  FontWeight,
  Spacing,
  BorderRadius,
} from "@/src/constants/theme";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

type DaySchedule = { open: string; close: string; closed: boolean };

export default function BranchSettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { user, token } = useAppSelector((s) => s.auth);
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [branch, setBranch] = useState<any>(null);

  // Form state
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [maxDailyTickets, setMaxDailyTickets] = useState("");
  const [avgTime, setAvgTime] = useState("");
  const [schedule, setSchedule] = useState<Record<string, DaySchedule>>({});

  const fetchBranch = useCallback(async () => {
    try {
      const branches = await api.branches.list(user?.tenantId ?? "", token!);
      const arr = Array.isArray(branches) ? branches : (branches?.data ?? []);
      if (arr.length > 0) {
        const b = arr[0];
        setBranch(b);
        setName(b.name ?? "");
        setAddress(b.address ?? "");
        setPhone(b.phone ?? "");
        setEmail(b.email ?? "");
        setMaxDailyTickets(String(b.maxDailyTickets ?? ""));
        setAvgTime(String(b.avgTimePerClient ?? ""));
        setSchedule(
          b.workingHours ??
            Object.fromEntries(
              DAYS.map((d) => [
                d,
                { open: "09:00", close: "18:00", closed: d === "sunday" },
              ]),
            ),
        );
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
    }
  }, []);

  useEffect(() => {
    fetchBranch();
  }, [fetchBranch]);

  const handleSave = async () => {
    if (!branch) return;
    try {
      setSaving(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await api.branches.update(
        branch.id,
        {
          name,
          address,
          phone,
          email,
          maxDailyTickets: parseInt(maxDailyTickets) || undefined,
          avgTimePerClient: parseInt(avgTime) || undefined,
          workingHours: schedule,
        },
        token!,
      );
      dispatch(
        addAlert({
          type: "success",
          title: t("common.success"),
          message: t("common.updated"),
        }),
      );
    } catch (err: any) {
      dispatch(
        addAlert({
          type: "error",
          title: t("common.error"),
          message: err.message,
        }),
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], closed: !prev[day]?.closed },
    }));
  };
  const updateTime = (day: string, field: "open" | "close", val: string) => {
    setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], [field]: val } }));
  };

  if (loading) return <LoadingOverlay visible={loading} />;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + Spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Text style={[styles.title, { color: theme.text }]}>
            {t("manager.branchSettings")}
          </Text>
        </Animated.View>

        {/* Basic Info */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Card title={t("settings.basicInfo")} index={0}>
            <Field
              label={t("branches.name")}
              value={name}
              onChange={setName}
              icon="business"
            />
            <Field
              label={t("branches.address")}
              value={address}
              onChange={setAddress}
              icon="location"
            />
            <Field
              label={t("branches.phone")}
              value={phone}
              onChange={setPhone}
              icon="call"
              keyboard="phone-pad"
            />
            <Field
              label={t("branches.email")}
              value={email}
              onChange={setEmail}
              icon="mail"
              keyboard="email-address"
            />
          </Card>
        </Animated.View>

        {/* Operations */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Card title={t("settings.operations")} index={1}>
            <Field
              label={t("settings.maxDailyTickets")}
              value={maxDailyTickets}
              onChange={setMaxDailyTickets}
              icon="ticket"
              keyboard="number-pad"
            />
            <Field
              label={t("settings.avgTimePerClient")}
              value={avgTime}
              onChange={setAvgTime}
              icon="time"
              keyboard="number-pad"
            />
          </Card>
        </Animated.View>

        {/* Schedule */}
        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <Card title={t("settings.schedule")} index={2}>
            {DAYS.map((day) => (
              <View
                key={day}
                style={[styles.dayRow, { borderBottomColor: theme.border }]}
              >
                <TouchableOpacity
                  style={[
                    styles.dayToggle,
                    {
                      backgroundColor: schedule[day]?.closed
                        ? theme.surface
                        : `${theme.primary}15`,
                    },
                  ]}
                  onPress={() => toggleDay(day)}
                >
                  <Ionicons
                    name={
                      schedule[day]?.closed
                        ? "close-circle-outline"
                        : "checkmark-circle"
                    }
                    size={18}
                    color={
                      schedule[day]?.closed ? theme.textTertiary : theme.primary
                    }
                  />
                </TouchableOpacity>
                <Text
                  style={[
                    styles.dayName,
                    {
                      color: schedule[day]?.closed
                        ? theme.textTertiary
                        : theme.text,
                    },
                  ]}
                >
                  {t(`common.${day}`)}
                </Text>
                {!schedule[day]?.closed ? (
                  <View style={styles.timeRow}>
                    <TextInput
                      style={[
                        styles.timeInput,
                        {
                          color: theme.text,
                          backgroundColor: theme.surface,
                          borderColor: theme.border,
                        },
                      ]}
                      value={schedule[day]?.open ?? "09:00"}
                      onChangeText={(v) => updateTime(day, "open", v)}
                      maxLength={5}
                    />
                    <Text style={{ color: theme.textTertiary }}>–</Text>
                    <TextInput
                      style={[
                        styles.timeInput,
                        {
                          color: theme.text,
                          backgroundColor: theme.surface,
                          borderColor: theme.border,
                        },
                      ]}
                      value={schedule[day]?.close ?? "18:00"}
                      onChangeText={(v) => updateTime(day, "close", v)}
                      maxLength={5}
                    />
                  </View>
                ) : (
                  <Text
                    style={[styles.closedLabel, { color: theme.textTertiary }]}
                  >
                    {t("common.closed")}
                  </Text>
                )}
              </View>
            ))}
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).springify()}>
          <Button
            title={t("common.save")}
            onPress={handleSave}
            loading={saving}
            icon={<Ionicons name="checkmark" size={18} color="#fff" />}
          />
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  icon,
  keyboard,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  icon: string;
  keyboard?: "phone-pad" | "email-address" | "number-pad";
}) {
  const theme = useTheme();
  return (
    <View style={[fStyles.row, { borderBottomColor: theme.border }]}>
      <Ionicons
        name={`${icon}-outline` as any}
        size={18}
        color={theme.primary}
        style={{ width: 24 }}
      />
      <Text style={[fStyles.label, { color: theme.textSecondary }]}>
        {label}
      </Text>
      <TextInput
        style={[fStyles.input, { color: theme.text }]}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboard}
        autoCapitalize={keyboard === "email-address" ? "none" : "sentences"}
      />
    </View>
  );
}

const fStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  label: { width: 80, fontSize: FontSize.sm },
  input: { flex: 1, fontSize: FontSize.sm, textAlign: "right" },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing["3xl"] },
  title: {
    fontSize: FontSize["2xl"],
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.lg,
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  dayToggle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  dayName: { width: 50, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  timeRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
  },
  timeInput: {
    width: 70,
    textAlign: "center",
    fontSize: FontSize.sm,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  closedLabel: {
    flex: 1,
    textAlign: "right",
    fontSize: FontSize.sm,
    fontStyle: "italic",
  },
});
