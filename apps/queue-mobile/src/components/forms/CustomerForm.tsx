import React from "react";
import { View, StyleSheet } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import { customerSchema, CustomerFormData } from "@/src/validation/schemas";
import { Button, Input } from "@/src/components/ui";
import { useTheme } from "@/src/hooks/useTheme";
import { Spacing } from "@/src/constants/theme";

interface Props {
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function CustomerForm({ initialData, onSubmit, onCancel }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(customerSchema),
    defaultValues: {
      firstName: initialData?.firstName ?? "",
      lastName: initialData?.lastName ?? "",
      phone: initialData?.phone ?? "",
      email: initialData?.email ?? "",
    },
  });

  return (
    <View style={styles.form}>
      <Controller
        control={control}
        name="firstName"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t("customers.firstName")}
            placeholder={t("customers.firstNamePlaceholder")}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.firstName?.message as string}
            leftIcon={
              <Ionicons
                name="person-outline"
                size={18}
                color={theme.textTertiary}
              />
            }
          />
        )}
      />
      <Controller
        control={control}
        name="lastName"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t("customers.lastName")}
            placeholder={t("customers.lastNamePlaceholder")}
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.lastName?.message as string}
            leftIcon={
              <Ionicons
                name="person-outline"
                size={18}
                color={theme.textTertiary}
              />
            }
          />
        )}
      />
      <Controller
        control={control}
        name="phone"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t("customers.phone")}
            placeholder="+998"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.phone?.message as string}
            keyboardType="phone-pad"
            leftIcon={
              <Ionicons
                name="call-outline"
                size={18}
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
            label={t("customers.email")}
            placeholder="customer@example.com"
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.email?.message as string}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={
              <Ionicons
                name="mail-outline"
                size={18}
                color={theme.textTertiary}
              />
            }
          />
        )}
      />
      <View style={styles.actions}>
        <Button
          title={t("common.cancel")}
          variant="ghost"
          onPress={onCancel}
          style={{ flex: 1 }}
        />
        <Button
          title={initialData ? t("common.update") : t("common.create")}
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.md },
  actions: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.md },
});
