import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import { counterSchema, CounterFormData } from "@/src/validation/schemas";
import { Button, Input } from "@/src/components/ui";
import { useTheme } from "@/src/hooks/useTheme";
import {
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
} from "@/src/constants/theme";
import { api } from "@/src/services/api";
import { useAppSelector } from "@/src/store";

interface Props {
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function CounterForm({ initialData, onSubmit, onCancel }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { user, token } = useAppSelector((s) => s.auth);
  const [queues, setQueues] = useState<any[]>([]);

  useEffect(() => {
    if (token) {
      api.queues
        .list({})
        .then((q: any) => setQueues(Array.isArray(q) ? q : (q?.data ?? [])))
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
    resolver: yupResolver(counterSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      employeeId: initialData?.employeeId ?? "",
      queueIds: initialData?.queueIds ?? [],
    },
  });

  const selectedQueues = watch("queueIds") as string[] | undefined;

  return (
    <View style={styles.form}>
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t("counters.name")}
            placeholder={t("counters.namePlaceholder")}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.name?.message as string}
            leftIcon={
              <Ionicons
                name="desktop-outline"
                size={18}
                color={theme.textTertiary}
              />
            }
          />
        )}
      />

      {queues.length > 0 && (
        <View>
          <Text style={[styles.label, { color: theme.text }]}>
            {t("counters.queue")}
          </Text>
          <View style={styles.chipRow}>
            {queues.map((q: any) => {
              const isSelected = selectedQueues?.includes(q.id);
              return (
                <TouchableOpacity
                  key={q.id}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected
                        ? theme.primary
                        : theme.surface,
                      borderColor: isSelected ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => {
                    const current = selectedQueues ?? [];
                    const next = isSelected
                      ? current.filter((id: string) => id !== q.id)
                      : [...current, q.id];
                    setValue("queueIds", next);
                  }}
                >
                  <Text
                    style={{
                      color: isSelected ? "#fff" : theme.textSecondary,
                      fontSize: FontSize.sm,
                    }}
                  >
                    {q.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {errors.queueIds && (
            <Text style={styles.error}>{(errors.queueIds as any).message}</Text>
          )}
        </View>
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
  error: { color: "#EF4444", fontSize: FontSize.xs, marginTop: 4 },
  actions: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.md },
});
