import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";

import { useTheme } from "@/src/hooks/useTheme";
import { useAppSelector, useAppDispatch } from "@/src/store";
import { addAlert } from "@/src/store/slices/alertSlice";
import { clearAuth, updateUser } from "@/src/store/slices/authSlice";
import { setLanguage, setTheme } from "@/src/store/slices/settingsSlice";
import { SecureStorage } from "@/src/services/secure-storage";
import { api } from "@/src/services/api";
import {
  Button,
  Badge,
  BottomSheet,
  ConfirmDialog,
  LoadingOverlay,
} from "@/src/components/ui";
import {
  FontSize,
  FontWeight,
  Spacing,
  BorderRadius,
  Shadow,
} from "@/src/constants/theme";

type AccountView =
  | "menu"
  | "mainInfo"
  | "operations"
  | "timeSlots"
  | "editProfile";

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

export default function AccountScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { t, i18n } = useTranslation();
  const { user, token } = useAppSelector((s) => s.auth);
  const settings = useAppSelector((s) => s.settings);

  const [view, setView] = useState<AccountView>("menu");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showThemeSheet, setShowThemeSheet] = useState(false);
  const [showLangSheet, setShowLangSheet] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  // Branch data
  const [branch, setBranch] = useState<any>(null);

  // Edit profile state
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");

  // Operations state
  const [maxDailyTickets, setMaxDailyTickets] = useState("");
  const [avgTime, setAvgTime] = useState("");

  // Schedule state
  const [schedule, setSchedule] = useState<Record<string, DaySchedule>>({});

  const fetchBranch = useCallback(async () => {
    try {
      const branches = await api.branches.list(user?.tenantId ?? "", token!);
      const arr = Array.isArray(branches) ? branches : (branches?.data ?? []);
      if (arr.length > 0) {
        const b = arr[0];
        setBranch(b);
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

  // ─── Handlers ──────────────────────────────────────────

  const handleSaveOperations = async () => {
    if (!branch) return;
    try {
      setSaving(true);
      await api.branches.update(
        branch.id,
        {
          maxDailyTickets: parseInt(maxDailyTickets) || undefined,
          avgTimePerClient: parseInt(avgTime) || undefined,
        },
        token!,
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

  const handleSaveSchedule = async () => {
    if (!branch) return;
    try {
      setSaving(true);
      await api.branches.update(branch.id, { workingHours: schedule }, token!);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await api.employees.update(
        user!.userId,
        { firstName, lastName, email: email || undefined },
        token!,
      );
      dispatch(updateUser({ firstName, lastName, email: email || undefined }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      dispatch(
        addAlert({
          type: "success",
          title: t("common.success"),
          message: t("account.profileUpdated"),
        }),
      );
      setView("menu");
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

  const handleThemeChange = (value: "light" | "dark" | "system") => {
    dispatch(setTheme(value));
    setShowThemeSheet(false);
    Haptics.selectionAsync();
  };

  const handleLanguageChange = (lang: "en" | "ru" | "uz") => {
    dispatch(setLanguage(lang));
    i18n.changeLanguage(lang);
    setShowLangSheet(false);
    Haptics.selectionAsync();
  };

  const handleLogout = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await SecureStorage.clearAll();
    dispatch(clearAuth());
    router.replace("/");
  };

  const toggleDay = (day: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], closed: !prev[day]?.closed },
    }));
  };

  const updateTime = (day: string, field: "open" | "close", val: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: val },
    }));
  };

  const languages = [
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "ru", label: "Русский", flag: "🇷🇺" },
    { code: "uz", label: "O'zbek", flag: "🇺🇿" },
  ];

  const themes = [
    {
      value: "light" as const,
      label: t("account.themeLight"),
      icon: "sunny" as keyof typeof Ionicons.glyphMap,
    },
    {
      value: "dark" as const,
      label: t("account.themeDark"),
      icon: "moon" as keyof typeof Ionicons.glyphMap,
    },
    {
      value: "system" as const,
      label: t("account.themeSystem"),
      icon: "phone-portrait" as keyof typeof Ionicons.glyphMap,
    },
  ];

  const initials =
    `${(user?.firstName ?? "Q")[0]}${(user?.lastName ?? "P")[0]}`.toUpperCase();

  if (loading) return <LoadingOverlay visible />;

  // ─── Sub-view header ──────────────────────────────────

  const SubHeader = ({ title }: { title: string }) => (
    <Animated.View entering={FadeInDown.duration(200)} style={styles.subHeader}>
      <TouchableOpacity
        onPress={() => setView("menu")}
        style={[styles.backBtn, { backgroundColor: theme.surfaceSecondary }]}
        hitSlop={8}
      >
        <Ionicons name="arrow-back" size={20} color={theme.text} />
      </TouchableOpacity>
      <Text style={[styles.subTitle, { color: theme.text }]}>{title}</Text>
      <View style={{ width: 36 }} />
    </Animated.View>
  );

  // ─── Main Info View ───────────────────────────────────

  if (view === "mainInfo") {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + Spacing.md },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <SubHeader title={t("account.branchInfo")} />

          <Animated.View entering={FadeInDown.delay(100).duration(300)}>
            <View
              style={[
                styles.infoCard,
                { backgroundColor: theme.card },
                Shadow.sm,
              ]}
            >
              <View
                style={[
                  styles.infoIconWrap,
                  { backgroundColor: `${theme.primary}15` },
                ]}
              >
                <Ionicons name="business" size={32} color={theme.primary} />
              </View>
              <Text style={[styles.infoCardTitle, { color: theme.text }]}>
                {branch?.name ?? t("common.noData")}
              </Text>
              <Badge variant="primary" text={t("common.branch_manager")} />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(300)}>
            <View
              style={[
                styles.detailsCard,
                { backgroundColor: theme.card },
                Shadow.sm,
              ]}
            >
              <InfoRow
                icon="location"
                label={t("branches.address")}
                value={branch?.address ?? "—"}
              />
              <InfoRow
                icon="call"
                label={t("branches.phone")}
                value={branch?.phone ?? "—"}
              />
              <InfoRow
                icon="mail"
                label={t("branches.email")}
                value={branch?.email ?? "—"}
              />
              <InfoRow
                icon="time"
                label={t("settings.avgTimePerClient")}
                value={
                  branch?.avgTimePerClient
                    ? `${branch.avgTimePerClient} min`
                    : "—"
                }
              />
              <InfoRow
                icon="ticket"
                label={t("settings.maxDailyTickets")}
                value={
                  branch?.maxDailyTickets ? String(branch.maxDailyTickets) : "—"
                }
                last
              />
            </View>
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  // ─── Operations View ──────────────────────────────────

  if (view === "operations") {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + Spacing.md },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <SubHeader title={t("account.operations")} />

          <Animated.View entering={FadeInDown.delay(100).duration(300)}>
            <View
              style={[
                styles.opCard,
                { backgroundColor: theme.card },
                Shadow.sm,
              ]}
            >
              <View style={styles.opHeader}>
                <View style={[styles.opIcon, { backgroundColor: "#F59E0B15" }]}>
                  <Ionicons name="ticket" size={24} color="#F59E0B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.opLabel, { color: theme.text }]}>
                    {t("account.maxDailyTickets")}
                  </Text>
                  <Text style={[styles.opHint, { color: theme.textTertiary }]}>
                    {t("account.ticketsPerDay")}
                  </Text>
                </View>
              </View>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={[
                    styles.stepperBtn,
                    { backgroundColor: theme.surfaceSecondary },
                  ]}
                  onPress={() => {
                    const v = Math.max(
                      0,
                      (parseInt(maxDailyTickets) || 0) - 10,
                    );
                    setMaxDailyTickets(String(v));
                    Haptics.selectionAsync();
                  }}
                >
                  <Ionicons name="remove" size={20} color={theme.text} />
                </TouchableOpacity>
                <TextInput
                  style={[
                    styles.stepperInput,
                    {
                      color: theme.text,
                      backgroundColor: theme.surfaceSecondary,
                    },
                  ]}
                  value={maxDailyTickets}
                  onChangeText={setMaxDailyTickets}
                  keyboardType="number-pad"
                  textAlign="center"
                />
                <TouchableOpacity
                  style={[
                    styles.stepperBtn,
                    { backgroundColor: `${theme.primary}15` },
                  ]}
                  onPress={() => {
                    const v = (parseInt(maxDailyTickets) || 0) + 10;
                    setMaxDailyTickets(String(v));
                    Haptics.selectionAsync();
                  }}
                >
                  <Ionicons name="add" size={20} color={theme.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(300)}>
            <View
              style={[
                styles.opCard,
                { backgroundColor: theme.card },
                Shadow.sm,
              ]}
            >
              <View style={styles.opHeader}>
                <View style={[styles.opIcon, { backgroundColor: "#6366F115" }]}>
                  <Ionicons name="time" size={24} color="#6366F1" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.opLabel, { color: theme.text }]}>
                    {t("account.avgServiceTime")}
                  </Text>
                  <Text style={[styles.opHint, { color: theme.textTertiary }]}>
                    {t("account.minutesPerClient")}
                  </Text>
                </View>
              </View>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={[
                    styles.stepperBtn,
                    { backgroundColor: theme.surfaceSecondary },
                  ]}
                  onPress={() => {
                    const v = Math.max(1, (parseInt(avgTime) || 0) - 1);
                    setAvgTime(String(v));
                    Haptics.selectionAsync();
                  }}
                >
                  <Ionicons name="remove" size={20} color={theme.text} />
                </TouchableOpacity>
                <TextInput
                  style={[
                    styles.stepperInput,
                    {
                      color: theme.text,
                      backgroundColor: theme.surfaceSecondary,
                    },
                  ]}
                  value={avgTime}
                  onChangeText={setAvgTime}
                  keyboardType="number-pad"
                  textAlign="center"
                />
                <TouchableOpacity
                  style={[
                    styles.stepperBtn,
                    { backgroundColor: `${theme.primary}15` },
                  ]}
                  onPress={() => {
                    const v = (parseInt(avgTime) || 0) + 1;
                    setAvgTime(String(v));
                    Haptics.selectionAsync();
                  }}
                >
                  <Ionicons name="add" size={20} color={theme.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(300)}>
            <Button
              title={t("common.save")}
              onPress={handleSaveOperations}
              loading={saving}
              icon={<Ionicons name="checkmark" size={18} color="#fff" />}
            />
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  // ─── Time Slots View ──────────────────────────────────

  if (view === "timeSlots") {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + Spacing.md },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <SubHeader title={t("account.workingHours")} />

          <Animated.View entering={FadeInDown.delay(100).duration(300)}>
            <View
              style={[
                styles.detailsCard,
                { backgroundColor: theme.card },
                Shadow.sm,
              ]}
            >
              {DAYS.map((day, idx) => (
                <View
                  key={day}
                  style={[
                    styles.dayRow,
                    idx < DAYS.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: theme.divider,
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.dayToggle,
                      {
                        backgroundColor: schedule[day]?.closed
                          ? theme.surfaceSecondary
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
                        schedule[day]?.closed
                          ? theme.textTertiary
                          : theme.primary
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
                            backgroundColor: theme.surfaceSecondary,
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
                            backgroundColor: theme.surfaceSecondary,
                          },
                        ]}
                        value={schedule[day]?.close ?? "18:00"}
                        onChangeText={(v) => updateTime(day, "close", v)}
                        maxLength={5}
                      />
                    </View>
                  ) : (
                    <Text
                      style={[
                        styles.closedLabel,
                        { color: theme.textTertiary },
                      ]}
                    >
                      {t("common.closed")}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(300)}>
            <Button
              title={t("common.save")}
              onPress={handleSaveSchedule}
              loading={saving}
              icon={<Ionicons name="checkmark" size={18} color="#fff" />}
            />
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  // ─── Edit Profile View ────────────────────────────────

  if (view === "editProfile") {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + Spacing.md },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <SubHeader title={t("account.editProfile")} />

          <Animated.View entering={FadeInDown.delay(100).duration(300)}>
            <View
              style={[
                styles.detailsCard,
                { backgroundColor: theme.card },
                Shadow.sm,
              ]}
            >
              <View style={styles.fieldGroup}>
                <Text
                  style={[styles.fieldLabel, { color: theme.textSecondary }]}
                >
                  {t("auth.firstName")}
                </Text>
                <TextInput
                  style={[
                    styles.fieldInput,
                    {
                      color: theme.text,
                      backgroundColor: theme.surfaceSecondary,
                    },
                  ]}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder={t("auth.firstName")}
                  placeholderTextColor={theme.placeholder}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text
                  style={[styles.fieldLabel, { color: theme.textSecondary }]}
                >
                  {t("auth.lastName")}
                </Text>
                <TextInput
                  style={[
                    styles.fieldInput,
                    {
                      color: theme.text,
                      backgroundColor: theme.surfaceSecondary,
                    },
                  ]}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder={t("auth.lastName")}
                  placeholderTextColor={theme.placeholder}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text
                  style={[styles.fieldLabel, { color: theme.textSecondary }]}
                >
                  {t("auth.email")}
                </Text>
                <TextInput
                  style={[
                    styles.fieldInput,
                    {
                      color: theme.text,
                      backgroundColor: theme.surfaceSecondary,
                    },
                  ]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t("auth.email")}
                  placeholderTextColor={theme.placeholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text
                  style={[styles.fieldLabel, { color: theme.textSecondary }]}
                >
                  {t("settings.phone")}
                </Text>
                <View
                  style={[
                    styles.fieldDisabled,
                    { backgroundColor: theme.surfaceSecondary },
                  ]}
                >
                  <Ionicons
                    name="lock-closed"
                    size={14}
                    color={theme.textTertiary}
                  />
                  <Text
                    style={[
                      styles.fieldDisabledText,
                      { color: theme.textTertiary },
                    ]}
                  >
                    {user?.phone ?? ""}
                  </Text>
                </View>
                <Text style={[styles.fieldHint, { color: theme.textTertiary }]}>
                  {t("account.phoneReadOnly")}
                </Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(300)}>
            <Button
              title={t("common.save")}
              onPress={handleSaveProfile}
              loading={saving}
              icon={<Ionicons name="checkmark" size={18} color="#fff" />}
            />
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  // ─── Menu View (default) ──────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + Spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(300)}
          style={styles.profileHeader}
        >
          <View
            style={[styles.avatar, { backgroundColor: `${theme.primary}20` }]}
          >
            <Text style={[styles.avatarText, { color: theme.primary }]}>
              {initials}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.text }]}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text style={[styles.profileRole, { color: theme.textSecondary }]}>
              {t("common.branch_manager")}
            </Text>
            <Text style={[styles.profilePhone, { color: theme.textTertiary }]}>
              {user?.phone}
            </Text>
          </View>
        </Animated.View>

        {/* Branch Management Section */}
        <Animated.View entering={FadeInDown.delay(200).duration(300)}>
          <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>
            {t("manager.branchSettings")}
          </Text>
          <View
            style={[
              styles.menuCard,
              { backgroundColor: theme.card },
              Shadow.sm,
            ]}
          >
            <MenuItem
              icon="business"
              iconColor="#10B981"
              label={t("account.branchInfo")}
              onPress={() => {
                setView("mainInfo");
                Haptics.selectionAsync();
              }}
            />
            <View
              style={[styles.menuDivider, { backgroundColor: theme.divider }]}
            />
            <MenuItem
              icon="settings"
              iconColor="#6366F1"
              label={t("account.operations")}
              onPress={() => {
                setView("operations");
                Haptics.selectionAsync();
              }}
            />
            <View
              style={[styles.menuDivider, { backgroundColor: theme.divider }]}
            />
            <MenuItem
              icon="time"
              iconColor="#F59E0B"
              label={t("account.workingHours")}
              onPress={() => {
                setView("timeSlots");
                Haptics.selectionAsync();
              }}
            />
          </View>
        </Animated.View>

        {/* Personal Section */}
        <Animated.View entering={FadeInDown.delay(300).duration(300)}>
          <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>
            {t("account.personalInfo")}
          </Text>
          <View
            style={[
              styles.menuCard,
              { backgroundColor: theme.card },
              Shadow.sm,
            ]}
          >
            <MenuItem
              icon="person"
              iconColor="#3B82F6"
              label={t("account.editProfile")}
              onPress={() => {
                setFirstName(user?.firstName ?? "");
                setLastName(user?.lastName ?? "");
                setEmail(user?.email ?? "");
                setView("editProfile");
                Haptics.selectionAsync();
              }}
            />
          </View>
        </Animated.View>

        {/* Preferences Section */}
        <Animated.View entering={FadeInDown.delay(400).duration(300)}>
          <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>
            {t("settings.preferences")}
          </Text>
          <View
            style={[
              styles.menuCard,
              { backgroundColor: theme.card },
              Shadow.sm,
            ]}
          >
            <MenuItem
              icon="color-palette"
              iconColor="#EC4899"
              label={t("account.theme")}
              value={
                settings.theme === "system"
                  ? t("account.themeSystem")
                  : settings.theme === "dark"
                    ? t("account.themeDark")
                    : t("account.themeLight")
              }
              onPress={() => {
                setShowThemeSheet(true);
                Haptics.selectionAsync();
              }}
            />
            <View
              style={[styles.menuDivider, { backgroundColor: theme.divider }]}
            />
            <MenuItem
              icon="language"
              iconColor="#8B5CF6"
              label={t("settings.language")}
              value={
                languages.find((l) => l.code === settings.language)?.label ??
                "English"
              }
              onPress={() => {
                setShowLangSheet(true);
                Haptics.selectionAsync();
              }}
            />
          </View>
        </Animated.View>

        {/* Logout */}
        <Animated.View entering={FadeInDown.delay(500).duration(300)}>
          <TouchableOpacity
            style={[styles.logoutBtn, { backgroundColor: `${theme.error}10` }]}
            onPress={() => setShowLogout(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color={theme.error} />
            <Text style={[styles.logoutText, { color: theme.error }]}>
              {t("settings.logout")}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Version */}
        <Text style={[styles.version, { color: theme.textTertiary }]}>
          QueuePro v1.0.0
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Theme Bottom Sheet */}
      <BottomSheet
        visible={showThemeSheet}
        onClose={() => setShowThemeSheet(false)}
        title={t("account.theme")}
      >
        {themes.map((themeOption) => (
          <TouchableOpacity
            key={themeOption.value}
            style={[
              styles.sheetItem,
              {
                backgroundColor:
                  settings.theme === themeOption.value
                    ? `${theme.primary}12`
                    : "transparent",
              },
            ]}
            onPress={() => handleThemeChange(themeOption.value)}
          >
            <View
              style={[
                styles.sheetItemIcon,
                { backgroundColor: `${theme.primary}15` },
              ]}
            >
              <Ionicons
                name={themeOption.icon}
                size={20}
                color={theme.primary}
              />
            </View>
            <Text style={[styles.sheetItemLabel, { color: theme.text }]}>
              {themeOption.label}
            </Text>
            {settings.theme === themeOption.value && (
              <Ionicons
                name="checkmark-circle"
                size={22}
                color={theme.primary}
              />
            )}
          </TouchableOpacity>
        ))}
        <View style={{ height: Spacing.xl }} />
      </BottomSheet>

      {/* Language Bottom Sheet */}
      <BottomSheet
        visible={showLangSheet}
        onClose={() => setShowLangSheet(false)}
        title={t("settings.language")}
      >
        {languages.map((l) => (
          <TouchableOpacity
            key={l.code}
            style={[
              styles.sheetItem,
              {
                backgroundColor:
                  settings.language === l.code
                    ? `${theme.primary}12`
                    : "transparent",
              },
            ]}
            onPress={() => handleLanguageChange(l.code as any)}
          >
            <Text style={styles.langFlag}>{l.flag}</Text>
            <Text style={[styles.sheetItemLabel, { color: theme.text }]}>
              {l.label}
            </Text>
            {settings.language === l.code && (
              <Ionicons
                name="checkmark-circle"
                size={22}
                color={theme.primary}
              />
            )}
          </TouchableOpacity>
        ))}
        <View style={{ height: Spacing.xl }} />
      </BottomSheet>

      {/* Logout Confirm */}
      <ConfirmDialog
        visible={showLogout}
        title={t("settings.logout")}
        message={t("settings.logoutConfirm")}
        confirmText={t("settings.logout")}
        onConfirm={handleLogout}
        onClose={() => setShowLogout(false)}
        variant="danger"
      />
    </View>
  );
}

// ─── Helper Components ──────────────────────────────────

function MenuItem({
  icon,
  iconColor,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  value?: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View
        style={[styles.menuItemIcon, { backgroundColor: `${iconColor}15` }]}
      >
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={[styles.menuItemLabel, { color: theme.text }]}>{label}</Text>
      {value && (
        <Text style={[styles.menuItemValue, { color: theme.textTertiary }]}>
          {value}
        </Text>
      )}
      <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
    </TouchableOpacity>
  );
}

function InfoRow({
  icon,
  label,
  value,
  last,
}: {
  icon: string;
  label: string;
  value: string;
  last?: boolean;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.infoRow,
        !last && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.divider,
        },
      ]}
    >
      <Ionicons
        name={`${icon}-outline` as any}
        size={18}
        color={theme.primary}
        style={{ width: 24 }}
      />
      <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.infoValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing["3xl"] },

  // Sub-view header
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  subTitle: {
    flex: 1,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    textAlign: "center",
  },

  // Profile header
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing["2xl"],
    gap: Spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: FontSize["2xl"],
    fontWeight: FontWeight.bold,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  profileRole: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  profilePhone: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },

  // Section label
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },

  // Menu card
  menuCard: {
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.xl,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  menuItemIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  menuItemLabel: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  menuItemValue: {
    fontSize: FontSize.sm,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.lg + 32 + Spacing.md,
  },

  // Logout
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  logoutText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },

  // Version
  version: {
    textAlign: "center",
    fontSize: FontSize.xs,
    marginTop: Spacing.xl,
  },

  // Main Info
  infoCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  infoIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  infoCardTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  detailsCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  infoLabel: {
    width: 90,
    fontSize: FontSize.sm,
  },
  infoValue: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    textAlign: "right",
  },

  // Operations
  opCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  opHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  opIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  opLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  opHint: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  stepperInput: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.md,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },

  // Time slots
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  dayToggle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  dayName: {
    width: 50,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
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
  },
  closedLabel: {
    flex: 1,
    textAlign: "right",
    fontSize: FontSize.sm,
    fontStyle: "italic",
  },

  // Edit Profile
  fieldGroup: {
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  fieldInput: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    fontSize: FontSize.md,
  },
  fieldDisabled: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    opacity: 0.6,
  },
  fieldDisabledText: {
    fontSize: FontSize.md,
  },
  fieldHint: {
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },

  // Sheet items
  sheetItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  sheetItemIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  sheetItemLabel: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  langFlag: {
    fontSize: 24,
  },
});
