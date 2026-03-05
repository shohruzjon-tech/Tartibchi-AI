import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import { employeeSchema, EmployeeFormData } from "@/src/validation/schemas";
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
import { UserRole } from "@/src/types";

const ROLES = [UserRole.BRANCH_MANAGER, UserRole.STAFF] as const;

interface Props {
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function EmployeeForm({ initialData, onSubmit, onCancel }: Props) {
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
    resolver: yupResolver(employeeSchema),
    defaultValues: {
      firstName: initialData?.firstName ?? "",
      lastName: initialData?.lastName ?? "",
      phone: initialData?.phone ?? "",
      email: initialData?.email ?? "",
      role: initialData?.role ?? UserRole.STAFF,
      branchId: initialData?.branchId ?? "",
    },
  });

  const selectedRole = watch("role");
  const selectedBranch = watch("branchId");

  return (
    <View style={styles.form}>
      <Controller
        control={control}
        name="firstName"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t("employees.firstName")}
            placeholder={t("employees.firstNamePlaceholder")}
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
            label={t("employees.lastName")}
            placeholder={t("employees.lastNamePlaceholder")}
            value={value}
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
            label={t("employees.phone")}
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
      {/* Role */}
      <Text style={[styles.label, { color: theme.text }]}>
        {t("employees.role")}
      </Text>
      <View style={styles.chipRow}>
        {ROLES.map((r) => (
          <TouchableOpacity
            key={r}
            style={[
              styles.chip,
              {
                backgroundColor:
                  selectedRole === r ? theme.primary : theme.surface,
                borderColor: selectedRole === r ? theme.primary : theme.border,
              },
            ]}
            onPress={() => setValue("role", r)}
          >
            <Text
              style={{
                color: selectedRole === r ? "#fff" : theme.textSecondary,
                fontSize: FontSize.sm,
              }}
            >
              {r}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Branch */}
      {branches.length > 0 && (
        <View>
          <Text style={[styles.label, { color: theme.text }]}>
            {t("employees.branch")}
          </Text>
          <View style={styles.chipRow}>
            {branches.map((b: any) => (
              <TouchableOpacity
                key={b.id}
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      selectedBranch === b.id ? theme.primary : theme.surface,
                    borderColor:
                      selectedBranch === b.id ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setValue("branchId", b.id)}
              >
                <Text
                  style={{
                    color:
                      selectedBranch === b.id ? "#fff" : theme.textSecondary,
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
