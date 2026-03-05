import React from "react";
import { View, StyleSheet } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import { branchSchema, BranchFormData } from "@/src/validation/schemas";
import { Button, Input } from "@/src/components/ui";
import { useTheme } from "@/src/hooks/useTheme";
import { Spacing } from "@/src/constants/theme";

interface Props {
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function BranchForm({ initialData, onSubmit, onCancel }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(branchSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      address: initialData?.address ?? "",
      phone: initialData?.phone ?? "",
      email: initialData?.email ?? "",
    },
  });

  return (
    <View style={styles.form}>
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t("branches.name")}
            placeholder={t("branches.namePlaceholder")}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.name?.message as string}
            leftIcon={
              <Ionicons
                name="business-outline"
                size={18}
                color={theme.textTertiary}
              />
            }
          />
        )}
      />
      <Controller
        control={control}
        name="address"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t("branches.address")}
            placeholder={t("branches.addressPlaceholder")}
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.address?.message as string}
            leftIcon={
              <Ionicons
                name="location-outline"
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
            label={t("branches.phone")}
            placeholder="+998 90 123 45 67"
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.phone?.message as string}
            leftIcon={
              <Ionicons
                name="call-outline"
                size={18}
                color={theme.textTertiary}
              />
            }
            keyboardType="phone-pad"
          />
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t("branches.email")}
            placeholder="branch@example.com"
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.email?.message as string}
            leftIcon={
              <Ionicons
                name="mail-outline"
                size={18}
                color={theme.textTertiary}
              />
            }
            keyboardType="email-address"
            autoCapitalize="none"
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
