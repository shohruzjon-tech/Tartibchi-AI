import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/src/hooks/useTheme";
import { useAppSelector, useAppDispatch } from "@/src/store";
import { addAlert } from "@/src/store/slices/alertSlice";
import {
  setLanguage,
  updateNotificationPref,
  toggleBiometric,
} from "@/src/store/slices/settingsSlice";
import { clearAuth } from "@/src/store/slices/authSlice";
import { SecureStorage } from "@/src/services/secure-storage";
import { api } from "@/src/services/api";
import {
  Card,
  Button,
  Badge,
  BottomSheet,
  ConfirmDialog,
} from "@/src/components/ui";
import {
  FontSize,
  FontWeight,
  Spacing,
  BorderRadius,
  Shadow,
} from "@/src/constants/theme";
import { router } from "expo-router";

type Tab = "general" | "notifications" | "telegram";

export default function SettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { t, i18n } = useTranslation();
  const { user, token } = useAppSelector((s) => s.auth);
  const settings = useAppSelector((s) => s.settings);
  const isSolo = user?.tenantMode === "SOLO";

  const [tab, setTab] = useState<Tab>("general");
  const [showLogout, setShowLogout] = useState(false);
  const [showLangSheet, setShowLangSheet] = useState(false);
  const [botStatus, setBotStatus] = useState<any>(null);
  const [botToken, setBotToken] = useState("");
  const [botLoading, setBotLoading] = useState(false);

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

  // Telegram bot
  const fetchBotStatus = useCallback(async () => {
    try {
      const status = await api.telegram.getBotStatus(token!);
      setBotStatus(status);
    } catch {}
  }, []);

  useEffect(() => {
    if (tab === "telegram") fetchBotStatus();
  }, [tab, fetchBotStatus]);

  const handleBotAction = async (
    action: "start" | "stop" | "restart" | "delete",
  ) => {
    try {
      setBotLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      switch (action) {
        case "start":
          await api.telegram.startBot(token!);
          break;
        case "stop":
          await api.telegram.stopBot(token!);
          break;
        case "restart":
          await api.telegram.restartBot(token!);
          break;
        case "delete":
          await api.telegram.deleteBot(token!);
          break;
      }
      fetchBotStatus();
      dispatch(
        addAlert({
          type: "success",
          title: t("common.success"),
          message: `Bot ${action}ed`,
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
      setBotLoading(false);
    }
  };

  const handleRegisterBot = async () => {
    if (!botToken.trim()) return;
    try {
      setBotLoading(true);
      await api.telegram.registerBot(botToken.trim(), token!);
      dispatch(
        addAlert({
          type: "success",
          title: t("common.success"),
          message: "Bot registered",
        }),
      );
      fetchBotStatus();
    } catch (err: any) {
      dispatch(
        addAlert({
          type: "error",
          title: t("common.error"),
          message: err.message,
        }),
      );
    } finally {
      setBotLoading(false);
    }
  };

  const languages = [
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "ru", label: "Русский", flag: "🇷🇺" },
    { code: "uz", label: "O'zbek", flag: "🇺🇿" },
  ];

  const tabs: {
    key: Tab;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    { key: "general", label: t("settings.general"), icon: "settings" },
    {
      key: "notifications",
      label: t("settings.notifications"),
      icon: "notifications",
    },
    { key: "telegram", label: t("settings.telegram"), icon: "paper-plane" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Tabs */}
      <View style={{ paddingTop: insets.top + Spacing.sm }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabRow}
        >
          {tabs.map((t2) => (
            <TouchableOpacity
              key={t2.key}
              style={[
                styles.tabBtn,
                {
                  backgroundColor:
                    tab === t2.key ? theme.primary : theme.surface,
                  borderColor: tab === t2.key ? theme.primary : theme.border,
                },
              ]}
              onPress={() => {
                setTab(t2.key);
                Haptics.selectionAsync();
              }}
            >
              <Ionicons
                name={t2.icon}
                size={16}
                color={tab === t2.key ? "#fff" : theme.textSecondary}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: tab === t2.key ? "#fff" : theme.textSecondary },
                ]}
              >
                {t2.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {tab === "general" && (
          <>
            <Animated.View entering={FadeInDown.delay(100).springify()}>
              <Card title={t("settings.account")} index={0}>
                <SettingRow
                  icon="person"
                  label={t("settings.name")}
                  value={`${user?.firstName ?? ""} ${user?.lastName ?? ""}`}
                />
                <SettingRow
                  icon="call"
                  label={t("settings.phone")}
                  value={user?.phone ?? ""}
                />
                <SettingRow
                  icon="business"
                  label={t("settings.workspace")}
                  value={user?.workspaceName ?? ""}
                />
                <SettingRow
                  icon="toggle"
                  label={t("settings.mode")}
                  right={
                    <Badge
                      variant={isSolo ? "success" : "info"}
                      text={user?.tenantMode ?? ""}
                    />
                  }
                />
              </Card>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <Card title={t("settings.preferences")} index={1}>
                <TouchableOpacity onPress={() => setShowLangSheet(true)}>
                  <SettingRow
                    icon="language"
                    label={t("settings.language")}
                    value={
                      languages.find((l) => l.code === settings.language)
                        ?.label ?? "English"
                    }
                    showArrow
                  />
                </TouchableOpacity>
                <SettingRow
                  icon="finger-print"
                  label={t("settings.biometric")}
                  right={
                    <Switch
                      value={settings.biometricEnabled}
                      onValueChange={() => {
                        dispatch(toggleBiometric());
                      }}
                      trackColor={{
                        false: theme.border,
                        true: `${theme.primary}60`,
                      }}
                      thumbColor={
                        settings.biometricEnabled
                          ? theme.primary
                          : theme.textTertiary
                      }
                    />
                  }
                />
              </Card>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(300).springify()}>
              <Button
                title={t("settings.logout")}
                variant="danger"
                onPress={() => setShowLogout(true)}
                icon={<Ionicons name="log-out" size={18} color="#fff" />}
              />
            </Animated.View>
          </>
        )}

        {tab === "notifications" && (
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <Card title={t("settings.pushNotifications")} index={0}>
              <NotifToggle
                label={t("settings.pushEnabled")}
                value={settings.notifications.pushEnabled}
                onChange={() =>
                  dispatch(
                    updateNotificationPref({
                      pushEnabled: !settings.notifications.pushEnabled,
                    }),
                  )
                }
              />
              <NotifToggle
                label={t("settings.ticketCalled")}
                value={settings.notifications.ticketCalled}
                onChange={() =>
                  dispatch(
                    updateNotificationPref({
                      ticketCalled: !settings.notifications.ticketCalled,
                    }),
                  )
                }
              />
              <NotifToggle
                label={t("settings.ticketAlmostReady")}
                value={settings.notifications.ticketAlmostReady}
                onChange={() =>
                  dispatch(
                    updateNotificationPref({
                      ticketAlmostReady:
                        !settings.notifications.ticketAlmostReady,
                    }),
                  )
                }
              />
              <NotifToggle
                label={t("settings.appointmentReminder")}
                value={settings.notifications.appointmentReminder}
                onChange={() =>
                  dispatch(
                    updateNotificationPref({
                      appointmentReminder:
                        !settings.notifications.appointmentReminder,
                    }),
                  )
                }
              />
              <NotifToggle
                label={t("settings.queueUpdates")}
                value={settings.notifications.queueUpdates}
                onChange={() =>
                  dispatch(
                    updateNotificationPref({
                      queueUpdates: !settings.notifications.queueUpdates,
                    }),
                  )
                }
              />
              <NotifToggle
                label={t("settings.systemAlerts")}
                value={settings.notifications.systemAlerts}
                onChange={() =>
                  dispatch(
                    updateNotificationPref({
                      systemAlerts: !settings.notifications.systemAlerts,
                    }),
                  )
                }
              />
            </Card>
            <Card title={t("settings.feedback")} index={1}>
              <NotifToggle
                label={t("settings.sound")}
                value={settings.notifications.sound}
                onChange={() =>
                  dispatch(
                    updateNotificationPref({
                      sound: !settings.notifications.sound,
                    }),
                  )
                }
              />
              <NotifToggle
                label={t("settings.vibration")}
                value={settings.notifications.vibration}
                onChange={() =>
                  dispatch(
                    updateNotificationPref({
                      vibration: !settings.notifications.vibration,
                    }),
                  )
                }
              />
            </Card>
          </Animated.View>
        )}

        {tab === "telegram" && (
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <Card title={t("settings.telegramBot")} index={0}>
              {botStatus ? (
                <>
                  <SettingRow
                    icon="paper-plane"
                    label={t("settings.botStatus")}
                    right={
                      <Badge
                        variant={botStatus.isRunning ? "success" : "warning"}
                        text={botStatus.isRunning ? "Running" : "Stopped"}
                      />
                    }
                  />
                  {botStatus.stats && (
                    <>
                      <SettingRow
                        icon="people"
                        label="Users"
                        value={String(botStatus.stats.users ?? 0)}
                      />
                      <SettingRow
                        icon="chatbubble"
                        label="Messages"
                        value={String(botStatus.stats.messages ?? 0)}
                      />
                    </>
                  )}
                  <View style={styles.botActions}>
                    {!botStatus.isRunning && (
                      <Button
                        title="Start"
                        variant="primary"
                        onPress={() => handleBotAction("start")}
                        loading={botLoading}
                        size="sm"
                      />
                    )}
                    {botStatus.isRunning && (
                      <Button
                        title="Stop"
                        variant="secondary"
                        onPress={() => handleBotAction("stop")}
                        loading={botLoading}
                        size="sm"
                      />
                    )}
                    <Button
                      title="Restart"
                      variant="ghost"
                      onPress={() => handleBotAction("restart")}
                      loading={botLoading}
                      size="sm"
                    />
                    <Button
                      title="Delete"
                      variant="danger"
                      onPress={() => handleBotAction("delete")}
                      loading={botLoading}
                      size="sm"
                    />
                  </View>
                </>
              ) : (
                <View style={styles.botRegister}>
                  <Text
                    style={[styles.botLabel, { color: theme.textSecondary }]}
                  >
                    {t("settings.connectTelegram")}
                  </Text>
                  <View
                    style={[
                      styles.botInput,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Ionicons name="key" size={18} color={theme.textTertiary} />
                    <Text
                      style={{ color: theme.text, flex: 1 }}
                      numberOfLines={1}
                    >
                      {botToken || t("settings.pasteToken")}
                    </Text>
                  </View>
                  <Button
                    title="Register Bot"
                    onPress={handleRegisterBot}
                    loading={botLoading}
                  />
                </View>
              )}
            </Card>
          </Animated.View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Language Sheet */}
      {showLangSheet && (
        <BottomSheet visible onClose={() => setShowLangSheet(false)}>
          <Text style={[styles.sheetTitle, { color: theme.text }]}>
            {t("settings.language")}
          </Text>
          {languages.map((l) => (
            <TouchableOpacity
              key={l.code}
              style={[
                styles.langItem,
                {
                  backgroundColor:
                    settings.language === l.code
                      ? `${theme.primary}15`
                      : "transparent",
                  borderColor:
                    settings.language === l.code ? theme.primary : theme.border,
                },
              ]}
              onPress={() => handleLanguageChange(l.code as any)}
            >
              <Text style={styles.langFlag}>{l.flag}</Text>
              <Text style={[styles.langLabel, { color: theme.text }]}>
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
        </BottomSheet>
      )}

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

function SettingRow({
  icon,
  label,
  value,
  right,
  showArrow,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  right?: React.ReactNode;
  showArrow?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={[srStyles.row, { borderBottomColor: theme.border }]}>
      <Ionicons
        name={icon}
        size={18}
        color={theme.primary}
        style={{ width: 24 }}
      />
      <Text style={[srStyles.label, { color: theme.text }]}>{label}</Text>
      {value && (
        <Text style={[srStyles.value, { color: theme.textSecondary }]}>
          {value}
        </Text>
      )}
      {right}
      {showArrow && (
        <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
      )}
    </View>
  );
}

function NotifToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={[srStyles.row, { borderBottomColor: theme.border }]}>
      <Text style={[srStyles.label, { color: theme.text, flex: 1 }]}>
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: theme.border, true: `${theme.primary}60` }}
        thumbColor={value ? theme.primary : theme.textTertiary}
      />
    </View>
  );
}

const srStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  label: { flex: 1, fontSize: FontSize.sm },
  value: { fontSize: FontSize.sm },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabRow: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 6,
  },
  tabLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing["3xl"] },
  sheetTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.lg,
  },
  langItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  langFlag: { fontSize: 24 },
  langLabel: { flex: 1, fontSize: FontSize.md, fontWeight: FontWeight.medium },
  botActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  botRegister: { gap: Spacing.md },
  botLabel: { fontSize: FontSize.sm },
  botInput: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
});
