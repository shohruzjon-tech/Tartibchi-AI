import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/src/hooks/useTheme";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { setSessionToken, setWorkspaces } from "@/src/store/slices/authSlice";
import { addAlert } from "@/src/store/slices/alertSlice";
import { api } from "@/src/services/api";
import { OtpInput, Button } from "@/src/components/ui";
import { FloatingParticles } from "@/src/components/ui/AnimatedBackgrounds";
import {
  FontSize,
  FontWeight,
  Spacing,
  BorderRadius,
} from "@/src/constants/theme";

export default function OtpScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { otpPhone } = useAppSelector((s) => s.auth);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (!otpPhone) {
      router.replace("/(auth)/login");
      return;
    }
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [otpPhone]);

  const handleVerify = async (code: string) => {
    try {
      setLoading(true);
      setError(false);
      const result = await api.auth.loginWithOtp({ phone: otpPhone!, code });

      if (result.workspaces) {
        dispatch(setSessionToken(result.sessionToken));
        dispatch(setWorkspaces(result.workspaces));
        router.push("/(auth)/select-workspace");
      } else if (result.accessToken) {
        // Direct login (single workspace + role)
        const { setAuth } = await import("@/src/store/slices/authSlice");
        const { SecureStorage } = await import("@/src/services/secure-storage");
        dispatch(setAuth(result));
        await SecureStorage.setTokens(result.accessToken, result.refreshToken);
        router.replace("/");
      }
    } catch (err: any) {
      setError(true);
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

  const handleResend = async () => {
    if (countdown > 0) return;
    try {
      await api.auth.requestOtp({ phone: otpPhone! });
      setCountdown(60);
      dispatch(addAlert({ type: "success", title: t("auth.otpResend") }));
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

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FloatingParticles />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 40 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            style={styles.header}
          >
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: `${theme.primary}15` },
              ]}
            >
              <Ionicons
                name="shield-checkmark"
                size={40}
                color={theme.primary}
              />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>
              {t("auth.otpTitle")}
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {t("auth.otpSubtitle")}
            </Text>
            <Text style={[styles.phone, { color: theme.primary }]}>
              {otpPhone}
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            style={styles.otpSection}
          >
            <OtpInput onComplete={handleVerify} error={error} />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            style={styles.resendRow}
          >
            <Button
              title={
                countdown > 0
                  ? t("auth.otpResendIn", { seconds: countdown })
                  : t("auth.otpResend")
              }
              onPress={handleResend}
              variant="ghost"
              disabled={countdown > 0}
            />
          </Animated.View>

          {loading && (
            <View style={styles.loadingWrap}>
              <Text
                style={[styles.loadingText, { color: theme.textSecondary }]}
              >
                {t("common.loading")}
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing["4xl"],
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["4xl"],
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius["2xl"],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize["2xl"],
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.md,
    textAlign: "center",
  },
  phone: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginTop: Spacing.xs,
  },
  otpSection: {
    marginBottom: Spacing["3xl"],
  },
  resendRow: {
    alignItems: "center",
  },
  loadingWrap: {
    alignItems: "center",
    marginTop: Spacing.xl,
  },
  loadingText: {
    fontSize: FontSize.md,
  },
});
