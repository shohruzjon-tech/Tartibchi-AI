import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/src/hooks/useTheme";
import { useAppDispatch } from "@/src/store";
import { setOtpPhone, setLoading } from "@/src/store/slices/authSlice";
import { addAlert } from "@/src/store/slices/alertSlice";
import { api } from "@/src/services/api";
import { phoneSchema, PhoneFormData } from "@/src/validation/schemas";
import { Button, Input, GradientOrbs } from "@/src/components/ui";
import {
  FontSize,
  FontWeight,
  Spacing,
  BorderRadius,
} from "@/src/constants/theme";

export default function LoginScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const [loading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PhoneFormData>({
    resolver: yupResolver(phoneSchema),
    defaultValues: { phone: "+998" },
  });

  const onSubmit = async (data: PhoneFormData) => {
    try {
      setIsLoading(true);
      await api.auth.requestOtp({ phone: data.phone });
      dispatch(setOtpPhone(data.phone));
      router.push("/(auth)/otp");
    } catch (err: any) {
      dispatch(
        addAlert({
          type: "error",
          title: t("common.error"),
          message: err.message,
        }),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <GradientOrbs />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 60 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo & Title */}
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            style={styles.header}
          >
            <View
              style={[styles.logo, { backgroundColor: `${theme.primary}15` }]}
            >
              <Ionicons name="flash" size={40} color={theme.primary} />
            </View>
            <Text style={[styles.appName, { color: theme.primary }]}>
              {t("common.appName")}
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            style={styles.titleSection}
          >
            <Text style={[styles.title, { color: theme.text }]}>
              {t("auth.loginTitle")}
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {t("auth.loginSubtitle")}
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            style={styles.form}
          >
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t("auth.phone")}
                  placeholder={t("auth.phonePlaceholder")}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={
                    errors.phone?.message ? t(errors.phone.message) : undefined
                  }
                  keyboardType="phone-pad"
                  leftIcon={
                    <Ionicons
                      name="call-outline"
                      size={20}
                      color={theme.textTertiary}
                    />
                  }
                />
              )}
            />

            <Button
              title={t("auth.sendOtp")}
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              fullWidth
              size="lg"
            />
          </Animated.View>

          {/* Footer Links */}
          <Animated.View
            entering={FadeInUp.delay(400).springify()}
            style={styles.footer}
          >
            <TouchableOpacity
              onPress={() => router.push("/(auth)/register")}
              style={styles.linkRow}
            >
              <Text style={[styles.linkText, { color: theme.textSecondary }]}>
                {t("auth.noAccount")}{" "}
              </Text>
              <Text style={[styles.linkAction, { color: theme.primary }]}>
                {t("auth.signUp")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(auth)/staff-login")}
              style={[styles.staffButton, { borderColor: theme.border }]}
            >
              <Ionicons
                name="desktop-outline"
                size={18}
                color={theme.textSecondary}
              />
              <Text style={[styles.staffText, { color: theme.textSecondary }]}>
                {t("auth.staffLogin")}
              </Text>
            </TouchableOpacity>
          </Animated.View>
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
    marginBottom: Spacing["3xl"],
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius["2xl"],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  appName: {
    fontSize: FontSize["2xl"],
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
  },
  titleSection: {
    marginBottom: Spacing["3xl"],
  },
  title: {
    fontSize: FontSize["3xl"],
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.md,
    lineHeight: 22,
  },
  form: {
    marginBottom: Spacing["3xl"],
  },
  footer: {
    alignItems: "center",
    gap: Spacing.xl,
    marginTop: "auto",
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  linkText: {
    fontSize: FontSize.md,
  },
  linkAction: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  staffButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  staffText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
});
