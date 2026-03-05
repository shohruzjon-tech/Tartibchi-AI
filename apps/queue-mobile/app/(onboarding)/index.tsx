import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { router } from "expo-router";
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeInUp,
  SlideInRight,
  SlideOutLeft,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/src/hooks/useTheme";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { addAlert } from "@/src/store/slices/alertSlice";
import { api } from "@/src/services/api";
import { Button, Badge } from "@/src/components/ui";
import { GradientOrbs } from "@/src/components/ui/AnimatedBackgrounds";
import {
  FontSize,
  FontWeight,
  Spacing,
  BorderRadius,
  Shadow,
} from "@/src/constants/theme";
import { TenantMode } from "@/src/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const BUSINESS_TYPES = [
  "barber",
  "medical",
  "consulting",
  "education",
  "repair",
  "retail",
] as const;
const SLOT_DURATIONS = [15, 30, 45, 60, 90] as const;
const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const BUSINESS_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  barber: "cut",
  medical: "medkit",
  consulting: "chatbubbles",
  education: "school",
  repair: "construct",
  retail: "storefront",
};

type DaySchedule = { open: string; close: string; closed: boolean };
type WorkingHours = Record<string, DaySchedule>;

const defaultHours = (): WorkingHours =>
  Object.fromEntries(
    DAYS.map((d) => [
      d,
      { open: "09:00", close: "18:00", closed: d === "sunday" },
    ]),
  );

export default function OnboardingScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((s) => s.auth);
  const { t } = useTranslation();

  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<TenantMode | null>(null);
  const [businessType, setBusinessType] = useState<string>("");
  const [services, setServices] = useState<string[]>([]);
  const [serviceInput, setServiceInput] = useState("");
  const [slotDuration, setSlotDuration] = useState(30);
  const [workingHours, setWorkingHours] =
    useState<WorkingHours>(defaultHours());
  const [loading, setLoading] = useState(false);

  const totalSteps = mode === "SOLO" ? 3 : 2;

  const handleModeSelect = (m: TenantMode) => {
    setMode(m);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (m === "MULTI") {
      setStep(2); // skip solo setup
    } else {
      setStep(1);
    }
  };

  const addService = () => {
    const val = serviceInput.trim();
    if (val && !services.includes(val)) {
      setServices([...services, val]);
      setServiceInput("");
    }
  };

  const removeService = (s: string) => {
    setServices(services.filter((x) => x !== s));
  };

  const toggleDay = (day: string) => {
    setWorkingHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], closed: !prev[day].closed },
    }));
  };

  const updateTime = (day: string, field: "open" | "close", val: string) => {
    setWorkingHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: val },
    }));
  };

  const handleLaunch = async () => {
    try {
      setLoading(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const payload =
        mode === "SOLO"
          ? {
              mode: mode as string,
              businessType,
              services,
              slotDuration,
              workingHours,
            }
          : { mode: mode! as string };

      await api.onboarding.complete(payload, token!);
      router.replace("/");
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
  };

  const renderStep0 = () => (
    <Animated.View
      entering={FadeInDown.delay(100).springify()}
      style={styles.stepContent}
    >
      <View style={styles.stepHeader}>
        <View
          style={[styles.bigIcon, { backgroundColor: `${theme.primary}15` }]}
        >
          <Ionicons name="rocket" size={44} color={theme.primary} />
        </View>
        <Text style={[styles.stepTitle, { color: theme.text }]}>
          {t("onboarding.selectMode")}
        </Text>
        <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
          {t("onboarding.selectModeSubtitle")}
        </Text>
      </View>

      <View style={styles.modeCards}>
        {/* SOLO card */}
        <TouchableOpacity
          style={[
            styles.modeCard,
            {
              backgroundColor: theme.card,
              borderColor: mode === "SOLO" ? theme.primary : theme.border,
            },
            Shadow.md,
          ]}
          onPress={() => handleModeSelect("SOLO" as TenantMode)}
          activeOpacity={0.7}
        >
          <View style={[styles.modeIcon, { backgroundColor: "#10B98115" }]}>
            <Ionicons name="person" size={32} color="#10B981" />
          </View>
          <Text style={[styles.modeTitle, { color: theme.text }]}>
            {t("onboarding.soloMode")}
          </Text>
          <Text style={[styles.modeDesc, { color: theme.textSecondary }]}>
            {t("onboarding.soloDescription")}
          </Text>
          <View style={styles.modeFeatures}>
            {["Calendar bookings", "AI & Bot", "Time management"].map((f) => (
              <View key={f} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text
                  style={[styles.featureText, { color: theme.textSecondary }]}
                >
                  {f}
                </Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>

        {/* MULTI card */}
        <TouchableOpacity
          style={[
            styles.modeCard,
            {
              backgroundColor: theme.card,
              borderColor: mode === "MULTI" ? "#6366F1" : theme.border,
            },
            Shadow.md,
          ]}
          onPress={() => handleModeSelect("MULTI" as TenantMode)}
          activeOpacity={0.7}
        >
          <View style={[styles.modeIcon, { backgroundColor: "#6366F115" }]}>
            <Ionicons name="business" size={32} color="#6366F1" />
          </View>
          <Text style={[styles.modeTitle, { color: theme.text }]}>
            {t("onboarding.multiMode")}
          </Text>
          <Text style={[styles.modeDesc, { color: theme.textSecondary }]}>
            {t("onboarding.multiDescription")}
          </Text>
          <View style={styles.modeFeatures}>
            {["Multiple branches", "Team management", "Advanced analytics"].map(
              (f) => (
                <View key={f} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#6366F1" />
                  <Text
                    style={[styles.featureText, { color: theme.textSecondary }]}
                  >
                    {f}
                  </Text>
                </View>
              ),
            )}
          </View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderStep1Solo = () => (
    <Animated.View
      entering={FadeInRight.springify()}
      style={styles.stepContent}
    >
      <View style={styles.stepHeader}>
        <Text style={[styles.stepTitle, { color: theme.text }]}>
          {t("onboarding.setupProfile")}
        </Text>
        <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
          {t("onboarding.setupProfileSubtitle")}
        </Text>
      </View>

      {/* Business type */}
      <Text style={[styles.sectionLabel, { color: theme.text }]}>
        {t("onboarding.businessType")}
      </Text>
      <View style={styles.chipGrid}>
        {BUSINESS_TYPES.map((bt) => (
          <TouchableOpacity
            key={bt}
            style={[
              styles.chip,
              {
                backgroundColor:
                  businessType === bt ? theme.primary : theme.surface,
                borderColor: businessType === bt ? theme.primary : theme.border,
              },
            ]}
            onPress={() => {
              setBusinessType(bt);
              Haptics.selectionAsync();
            }}
          >
            <Ionicons
              name={BUSINESS_ICONS[bt]}
              size={18}
              color={businessType === bt ? "#fff" : theme.textSecondary}
            />
            <Text
              style={[
                styles.chipText,
                { color: businessType === bt ? "#fff" : theme.textSecondary },
              ]}
            >
              {t(`onboarding.${bt}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Services */}
      <Text
        style={[
          styles.sectionLabel,
          { color: theme.text, marginTop: Spacing.xl },
        ]}
      >
        {t("onboarding.services")}
      </Text>
      <View
        style={[
          styles.serviceInput,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <TextInput
          style={[styles.serviceTextInput, { color: theme.text }]}
          value={serviceInput}
          onChangeText={setServiceInput}
          placeholder={t("onboarding.addServicePlaceholder")}
          placeholderTextColor={theme.textTertiary}
          onSubmitEditing={addService}
          returnKeyType="done"
        />
        <TouchableOpacity
          onPress={addService}
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.tagWrap}>
        {services.map((s) => (
          <TouchableOpacity
            key={s}
            style={[
              styles.tag,
              {
                backgroundColor: `${theme.primary}15`,
                borderColor: `${theme.primary}30`,
              },
            ]}
            onPress={() => removeService(s)}
          >
            <Text style={[styles.tagText, { color: theme.primary }]}>{s}</Text>
            <Ionicons name="close-circle" size={16} color={theme.primary} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Slot duration */}
      <Text
        style={[
          styles.sectionLabel,
          { color: theme.text, marginTop: Spacing.xl },
        ]}
      >
        {t("onboarding.slotDuration")}
      </Text>
      <View style={styles.durationRow}>
        {SLOT_DURATIONS.map((d) => (
          <TouchableOpacity
            key={d}
            style={[
              styles.durationChip,
              {
                backgroundColor:
                  slotDuration === d ? theme.primary : theme.surface,
                borderColor: slotDuration === d ? theme.primary : theme.border,
              },
            ]}
            onPress={() => {
              setSlotDuration(d);
              Haptics.selectionAsync();
            }}
          >
            <Text
              style={[
                styles.durationText,
                { color: slotDuration === d ? "#fff" : theme.textSecondary },
              ]}
            >
              {d}m
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Working hours */}
      <Text
        style={[
          styles.sectionLabel,
          { color: theme.text, marginTop: Spacing.xl },
        ]}
      >
        {t("onboarding.workingHours")}
      </Text>
      {DAYS.map((day) => (
        <View
          key={day}
          style={[styles.dayRow, { borderBottomColor: theme.border }]}
        >
          <TouchableOpacity
            style={[
              styles.dayToggle,
              {
                backgroundColor: workingHours[day].closed
                  ? theme.surface
                  : `${theme.primary}15`,
              },
            ]}
            onPress={() => toggleDay(day)}
          >
            <Ionicons
              name={
                workingHours[day].closed
                  ? "close-circle-outline"
                  : "checkmark-circle"
              }
              size={18}
              color={
                workingHours[day].closed ? theme.textTertiary : theme.primary
              }
            />
          </TouchableOpacity>
          <Text
            style={[
              styles.dayName,
              {
                color: workingHours[day].closed
                  ? theme.textTertiary
                  : theme.text,
              },
            ]}
          >
            {t(`common.${day}`)}
          </Text>
          {!workingHours[day].closed && (
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
                value={workingHours[day].open}
                onChangeText={(v) => updateTime(day, "open", v)}
                placeholder="09:00"
                placeholderTextColor={theme.textTertiary}
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
                value={workingHours[day].close}
                onChangeText={(v) => updateTime(day, "close", v)}
                placeholder="18:00"
                placeholderTextColor={theme.textTertiary}
                maxLength={5}
              />
            </View>
          )}
          {workingHours[day].closed && (
            <Text style={[styles.closedLabel, { color: theme.textTertiary }]}>
              {t("common.closed")}
            </Text>
          )}
        </View>
      ))}

      <Button
        title={t("common.next")}
        onPress={() => setStep(2)}
        style={{ marginTop: Spacing.xl }}
        icon={<Ionicons name="arrow-forward" size={18} color="#fff" />}
      />
    </Animated.View>
  );

  const renderStep2Confirm = () => (
    <Animated.View
      entering={FadeInRight.springify()}
      style={styles.stepContent}
    >
      <View style={styles.stepHeader}>
        <View
          style={[styles.bigIcon, { backgroundColor: `${theme.success}15` }]}
        >
          <Ionicons name="checkmark-done" size={44} color={theme.success} />
        </View>
        <Text style={[styles.stepTitle, { color: theme.text }]}>
          {t("onboarding.allSet")}
        </Text>
        <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
          {t("onboarding.allSetSubtitle")}
        </Text>
      </View>

      <View
        style={[
          styles.summaryCard,
          { backgroundColor: theme.card, borderColor: theme.border },
          Shadow.sm,
        ]}
      >
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
            {t("onboarding.mode")}
          </Text>
          <Badge
            variant={mode === "SOLO" ? "success" : "info"}
            text={mode ?? ""}
          />
        </View>

        {mode === "SOLO" && businessType ? (
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
              {t("onboarding.businessType")}
            </Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>
              {t(`onboarding.${businessType}`)}
            </Text>
          </View>
        ) : null}

        {mode === "SOLO" && services.length > 0 && (
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
              {t("onboarding.services")}
            </Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>
              {services.join(", ")}
            </Text>
          </View>
        )}

        {mode === "SOLO" && (
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
              {t("onboarding.slotDuration")}
            </Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>
              {slotDuration} min
            </Text>
          </View>
        )}
      </View>

      <Button
        title={t("onboarding.launch")}
        onPress={handleLaunch}
        loading={loading}
        style={{ marginTop: Spacing.xl }}
        icon={<Ionicons name="rocket" size={18} color="#fff" />}
      />

      <TouchableOpacity
        style={styles.backLink}
        onPress={() => setStep(mode === "SOLO" ? 1 : 0)}
      >
        <Text style={[styles.backText, { color: theme.textSecondary }]}>
          {t("common.back")}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <GradientOrbs />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Progress bar */}
        <View style={styles.progress}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                {
                  backgroundColor: i <= step ? theme.primary : theme.border,
                  width: i === step ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        {step === 0 && renderStep0()}
        {step === 1 && renderStep1Solo()}
        {step === 2 && renderStep2Confirm()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.xl },
  progress: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginBottom: Spacing["2xl"],
  },
  progressDot: { height: 8, borderRadius: 4 },
  stepContent: { flex: 1 },
  stepHeader: { alignItems: "center", marginBottom: Spacing["2xl"] },
  bigIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  stepTitle: {
    fontSize: FontSize["2xl"],
    fontWeight: FontWeight.bold,
    textAlign: "center",
  },
  stepSubtitle: {
    fontSize: FontSize.md,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  modeCards: { gap: Spacing.lg },
  modeCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
  },
  modeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  modeTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  modeDesc: { fontSize: FontSize.sm, marginTop: Spacing.xs },
  modeFeatures: { marginTop: Spacing.md, gap: Spacing.xs },
  featureRow: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
  featureText: { fontSize: FontSize.sm },
  sectionLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 6,
  },
  chipText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  serviceInput: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  serviceTextInput: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.md,
  },
  addBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    margin: 4,
    borderRadius: BorderRadius.md,
  },
  tagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  tagText: { fontSize: FontSize.sm },
  durationRow: { flexDirection: "row", gap: Spacing.sm },
  durationChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  durationText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
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
  summaryCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: { fontSize: FontSize.sm },
  summaryValue: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  backLink: { alignSelf: "center", paddingVertical: Spacing.lg },
  backText: { fontSize: FontSize.md },
});
