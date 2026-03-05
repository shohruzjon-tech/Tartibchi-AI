import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/src/hooks/useTheme";
import { useAppDispatch, useAppSelector } from "@/src/store";
import {
  setStaffAuth,
  setPendingSelection,
} from "@/src/store/slices/staffSlice";
import { addAlert } from "@/src/store/slices/alertSlice";
import { api } from "@/src/services/api";
import { FloatingParticles } from "@/src/components/ui/AnimatedBackgrounds";
import { SecureStorage } from "@/src/services/secure-storage";
import { staffLoginSchema, StaffLoginFormData } from "@/src/validation/schemas";
import { Button, Input, Card } from "@/src/components/ui";
import {
  FontSize,
  FontWeight,
  Spacing,
  BorderRadius,
} from "@/src/constants/theme";

export default function StaffLoginScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { pendingCounters, selectionToken } = useAppSelector((s) => s.staff);

  const [step, setStep] = useState<"login" | "counter">(
    pendingCounters ? "counter" : "login",
  );
  const [selectedCounter, setSelectedCounter] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<StaffLoginFormData>({
    resolver: yupResolver(staffLoginSchema),
    defaultValues: { login: "", passcode: "" },
  });

  const onLogin = async (data: StaffLoginFormData) => {
    try {
      setSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const result = await api.staffAuth.login(data);

      if (result.counters) {
        dispatch(
          setPendingSelection({
            selectionToken: result.selectionToken,
            counters: result.counters,
          }),
        );
        setStep("counter");
      } else if (result.accessToken) {
        dispatch(setStaffAuth(result));
        await SecureStorage.setStaffTokens(
          result.accessToken,
          result.refreshToken,
        );
        router.replace("/");
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
      setSubmitting(false);
    }
  };

  const onSelectCounter = async () => {
    if (!selectedCounter || !selectionToken) return;
    try {
      setSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const result = await api.staffAuth.selectCounter({
        counterId: selectedCounter,
        selectionToken,
      });

      dispatch(setStaffAuth(result));
      await SecureStorage.setStaffTokens(
        result.accessToken,
        result.refreshToken,
      );
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
      setSubmitting(false);
    }
  };

  if (step === "counter") {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.background, paddingTop: insets.top + 20 },
        ]}
      >
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.header}
        >
          <View
            style={[styles.iconWrap, { backgroundColor: `${theme.warning}15` }]}
          >
            <Ionicons name="desktop" size={36} color={theme.warning} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>
            {t("staffPortal.selectCounter")}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {t("staffPortal.selectCounterSubtitle")}
          </Text>
        </Animated.View>

        <ScrollView contentContainerStyle={styles.counterList}>
          {(pendingCounters ?? []).map((c: any, i: number) => (
            <Animated.View
              key={c.id}
              entering={FadeInDown.delay(200 + i * 80).springify()}
            >
              <TouchableOpacity
                style={[
                  styles.counterCard,
                  {
                    backgroundColor: theme.card,
                    borderColor:
                      selectedCounter === c.id ? theme.primary : theme.border,
                    borderWidth: selectedCounter === c.id ? 2 : 1,
                  },
                ]}
                onPress={() => setSelectedCounter(c.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={
                    selectedCounter === c.id
                      ? "radio-button-on"
                      : "radio-button-off"
                  }
                  size={22}
                  color={
                    selectedCounter === c.id
                      ? theme.primary
                      : theme.textTertiary
                  }
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.counterName, { color: theme.text }]}>
                    {c.name}
                  </Text>
                  {c.queue?.name && (
                    <Text
                      style={[
                        styles.counterQueue,
                        { color: theme.textTertiary },
                      ]}
                    >
                      {c.queue.name}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>

        <View
          style={[
            styles.bottomBar,
            { paddingBottom: insets.bottom + Spacing.md },
          ]}
        >
          <Button
            title={t("staffPortal.startShift")}
            onPress={onSelectCounter}
            loading={submitting}
            disabled={!selectedCounter}
            icon={<Ionicons name="play" size={18} color="#fff" />}
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <FloatingParticles />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.header}
        >
          <View
            style={[styles.iconWrap, { backgroundColor: `${theme.warning}15` }]}
          >
            <Ionicons name="headset" size={36} color={theme.warning} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>
            {t("auth.staffLogin")}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {t("auth.staffLoginSubtitle")}
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(250).springify()}
          style={styles.form}
        >
          <Controller
            control={control}
            name="login"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t("auth.login")}
                placeholder={t("auth.loginPlaceholder")}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.login?.message}
                leftIcon={
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={theme.textTertiary}
                  />
                }
                autoCapitalize="none"
              />
            )}
          />

          <Controller
            control={control}
            name="passcode"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t("auth.passcode")}
                placeholder={t("auth.passcodePlaceholder")}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.passcode?.message}
                secureTextEntry
                leftIcon={
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={theme.textTertiary}
                  />
                }
              />
            )}
          />

          <Button
            title={t("auth.signIn")}
            onPress={handleSubmit(onLogin)}
            loading={submitting}
            style={{ marginTop: Spacing.md }}
          />
        </Animated.View>

        <TouchableOpacity style={styles.link} onPress={() => router.back()}>
          <Text style={[styles.linkText, { color: theme.textSecondary }]}>
            {t("auth.backToLogin")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.xl },
  header: { alignItems: "center", marginBottom: Spacing["2xl"] },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.xl,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize["2xl"],
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  subtitle: { fontSize: FontSize.md, textAlign: "center" },
  form: { gap: Spacing.md },
  link: { alignSelf: "center", paddingVertical: Spacing.xl },
  linkText: { fontSize: FontSize.md },
  counterList: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    paddingBottom: 120,
  },
  counterCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  counterName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  counterQueue: { fontSize: FontSize.sm, marginTop: 2 },
  bottomBar: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md },
});
