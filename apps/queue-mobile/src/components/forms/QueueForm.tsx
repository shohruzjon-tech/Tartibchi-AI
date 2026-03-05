import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import { queueSchema, QueueFormData } from "@/src/validation/schemas";
import { Button, Input, Badge } from "@/src/components/ui";
import { useTheme } from "@/src/hooks/useTheme";
import {
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
} from "@/src/constants/theme";
import { api } from "@/src/services/api";
import { useAppSelector } from "@/src/store";

const STRATEGIES = ["FIFO", "PRIORITY"] as const;

interface Props {
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function QueueForm({ initialData, onSubmit, onCancel }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { user, token } = useAppSelector((s) => s.auth);
  const [branches, setBranches] = useState<any[]>([]);

  useEffect(() => {
    if (token) {
      api.branches
        .list(user?.tenantId ?? "", token)
        .then((b: any) => setBranches(Array.isArray(b) ? b : (b?.data ?? [])))
        .catch(() => {});
    }
  }, [token]);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(queueSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      prefix: initialData?.prefix ?? "",
      strategy: initialData?.strategy ?? "FIFO",
      branchId: initialData?.branchId ?? "",
    },
  });

  const selectedStrategy = watch("strategy");

  return (
    <View style={styles.form}>
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t("services.name")}
            placeholder={t("services.namePlaceholder")}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.name?.message as string}
            leftIcon={
              <Ionicons
                name="clipboard-outline"
                size={18}
                color={theme.textTertiary}
              />
            }
          />
        )}
      />
      <Controller
        control={control}
        name="prefix"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t("services.prefix")}
            placeholder="A"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.prefix?.message as string}
            leftIcon={
              <Ionicons
                name="pricetag-outline"
                size={18}
                color={theme.textTertiary}
              />
            }
            maxLength={5}
          />
        )}
      />

      {/* Strategy */}
      <Text style={[styles.label, { color: theme.text }]}>
        {t("services.strategy")}
      </Text>
      <View style={styles.chipRow}>
        {STRATEGIES.map((s) => (
          <TouchableOpacity
            key={s}
            style={[
              styles.chip,
              {
                backgroundColor:
                  selectedStrategy === s ? theme.primary : theme.surface,
                borderColor:
                  selectedStrategy === s ? theme.primary : theme.border,
              },
            ]}
            onPress={() => setValue("strategy", s)}
          >
            <Text
              style={{
                color: selectedStrategy === s ? "#fff" : theme.textSecondary,
                fontSize: FontSize.sm,
              }}
            >
              {s}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Branch */}
      {branches.length > 0 && (
        <Controller
          control={control}
          name="branchId"
          render={({ field: { value } }) => (
            <View>
              <Text style={[styles.label, { color: theme.text }]}>
                {t("services.branch")}
              </Text>
              <View style={styles.chipRow}>
                {branches.map((b: any) => (
                  <TouchableOpacity
                    key={b.id}
                    style={[
                      styles.chip,
                      {
                        backgroundColor:
                          value === b.id ? theme.primary : theme.surface,
                        borderColor:
                          value === b.id ? theme.primary : theme.border,
                      },
                    ]}
                    onPress={() => setValue("branchId", b.id)}
                  >
                    <Text
                      style={{
                        color: value === b.id ? "#fff" : theme.textSecondary,
                        fontSize: FontSize.sm,
                      }}
                    >
                      {b.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        />
      )}

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
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  actions: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.md },
});
