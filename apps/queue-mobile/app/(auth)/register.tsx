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
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/src/hooks/useTheme";
import { useAppDispatch } from "@/src/store";
import { setOtpPhone } from "@/src/store/slices/authSlice";
import { addAlert } from "@/src/store/slices/alertSlice";
import { api } from "@/src/services/api";
import { registerSchema, RegisterFormData } from "@/src/validation/schemas";
import { Button, Input } from "@/src/components/ui";
import { FloatingParticles } from "@/src/components/ui/AnimatedBackgrounds";
import {
  FontSize,
  FontWeight,
  Spacing,
  BorderRadius,
} from "@/src/constants/theme";

export default function RegisterScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "+998",
      businessName: "",
      email: "",
    },
  });

  const onSubmit = async (data: typeof registerSchema.__outputType) => {
    try {
      setLoading(true);
      await api.auth.register(data);
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
      setLoading(false);
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
            { paddingTop: insets.top + 20 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
            >
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            style={styles.titleSection}
          >
            <Text style={[styles.title, { color: theme.text }]}>
              {t("auth.registerTitle")}
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {t("auth.registerSubtitle")}
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            style={styles.form}
          >
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Controller
                  control={control}
                  name="firstName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label={t("auth.firstName")}
                      placeholder={t("auth.firstName")}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={
                        errors.firstName?.message
                          ? t(errors.firstName.message)
                          : undefined
                      }
                    />
                  )}
                />
              </View>
              <View style={styles.halfInput}>
                <Controller
                  control={control}
                  name="lastName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label={t("auth.lastName")}
                      placeholder={t("auth.lastName")}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={
                        errors.lastName?.message
                          ? t(errors.lastName.message)
                          : undefined
                      }
                    />
                  )}
                />
              </View>
            </View>

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

            <Controller
              control={control}
              name="businessName"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t("auth.businessName")}
                  placeholder={t("auth.businessName")}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={
                    errors.businessName?.message
                      ? t(errors.businessName.message)
                      : undefined
                  }
                  leftIcon={
                    <Ionicons
                      name="business-outline"
                      size={20}
                      color={theme.textTertiary}
                    />
                  }
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={`${t("auth.email")} (${t("common.optional")})`}
                  placeholder="email@example.com"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={
                    errors.email?.message ? t(errors.email.message) : undefined
                  }
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon={
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={theme.textTertiary}
                    />
                  }
                />
              )}
            />

            <Button
              title={t("auth.signUp")}
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              fullWidth
              size="lg"
            />
          </Animated.View>

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.linkRow}
            >
              <Text style={[styles.linkText, { color: theme.textSecondary }]}>
                {t("auth.haveAccount")}{" "}
              </Text>
              <Text style={[styles.linkAction, { color: theme.primary }]}>
                {t("auth.signIn")}
              </Text>
            </TouchableOpacity>
          </View>
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
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  titleSection: { marginBottom: Spacing["2xl"] },
  title: {
    fontSize: FontSize["2xl"],
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  subtitle: { fontSize: FontSize.md, lineHeight: 22 },
  form: { marginBottom: Spacing["2xl"] },
  row: { flexDirection: "row", gap: Spacing.md },
  halfInput: { flex: 1 },
  footer: { alignItems: "center", marginTop: "auto" },
  linkRow: { flexDirection: "row", alignItems: "center" },
  linkText: { fontSize: FontSize.md },
  linkAction: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
});
