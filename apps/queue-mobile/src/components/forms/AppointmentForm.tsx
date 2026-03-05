import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import {
  appointmentSchema,
  AppointmentFormData,
} from "@/src/validation/schemas";
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

export function AppointmentForm({ initialData, onSubmit, onCancel }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { token } = useAppSelector((s) => s.auth);
  const [services, setServices] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>(
    initialData?.timeSlot ?? "",
  );

  useEffect(() => {
    if (token) {
      api.queues
        .list({})
        .then((q: any) => setServices(Array.isArray(q) ? q : (q?.data ?? [])))
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
    resolver: yupResolver(appointmentSchema),
    defaultValues: {
      customerName: initialData?.customerName ?? "",
      customerPhone: initialData?.customerPhone ?? "",
      service: initialData?.service ?? "",
      date: initialData?.date ?? new Date().toISOString().split("T")[0],
      timeSlot: initialData?.timeSlot ?? "",
      duration: initialData?.duration ?? 30,
      notes: initialData?.notes ?? "",
    },
  });

  const selectedService = watch("service");
  const selectedDate = watch("date");

  useEffect(() => {
    if (selectedService && selectedDate && token) {
      api.appointments
        .getSlots(selectedDate, token)
        .then((s: any) => setSlots(Array.isArray(s) ? s : (s?.slots ?? [])))
        .catch(() => setSlots([]));
    }
  }, [selectedService, selectedDate, token]);

  return (
    <View style={styles.form}>
      <Controller
        control={control}
        name="customerName"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t("appointments.customerName")}
            placeholder={t("appointments.customerNamePlaceholder")}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.customerName?.message as string}
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
        name="customerPhone"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t("appointments.customerPhone")}
            placeholder="+998"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.customerPhone?.message as string}
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

      {/* Service Selection */}
      {services.length > 0 && (
        <View>
          <Text style={[styles.label, { color: theme.text }]}>
            {t("appointments.service")}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {services.map((s: any) => (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        selectedService === s.id
                          ? theme.primary
                          : theme.surface,
                      borderColor:
                        selectedService === s.id ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => setValue("service", s.id)}
                >
                  <Text
                    style={{
                      color:
                        selectedService === s.id ? "#fff" : theme.textSecondary,
                      fontSize: FontSize.sm,
                    }}
                  >
                    {s.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      <Controller
        control={control}
        name="date"
        render={({ field: { onChange, value } }) => (
          <Input
            label={t("appointments.date")}
            placeholder="YYYY-MM-DD"
            value={value}
            onChangeText={onChange}
            error={errors.date?.message as string}
            leftIcon={
              <Ionicons
                name="calendar-outline"
                size={18}
                color={theme.textTertiary}
              />
            }
          />
        )}
      />

      {/* Time Slots */}
      {slots.length > 0 && (
        <View>
          <Text style={[styles.label, { color: theme.text }]}>
            {t("appointments.time")}
          </Text>
          <View style={styles.slotGrid}>
            {slots.map((slot: any) => {
              const time = slot.time ?? slot.start ?? slot;
              const isAvailable = slot.available !== false;
              const isSelected = selectedSlot === time;
              return (
                <TouchableOpacity
                  key={time}
                  disabled={!isAvailable}
                  style={[
                    styles.slot,
                    {
                      backgroundColor: isSelected
                        ? theme.primary
                        : isAvailable
                          ? theme.surface
                          : theme.border,
                      borderColor: isSelected ? theme.primary : theme.border,
                      opacity: isAvailable ? 1 : 0.4,
                    },
                  ]}
                  onPress={() => {
                    setSelectedSlot(time);
                    setValue("timeSlot", time);
                  }}
                >
                  <Text
                    style={{
                      color: isSelected ? "#fff" : theme.textSecondary,
                      fontSize: FontSize.sm,
                    }}
                  >
                    {time}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      <Controller
        control={control}
        name="notes"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t("appointments.notes")}
            placeholder={t("appointments.notesPlaceholder")}
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            multiline
            numberOfLines={3}
            leftIcon={
              <Ionicons
                name="document-text-outline"
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
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  chipRow: { flexDirection: "row", gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  slotGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs },
  slot: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  actions: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.md },
});
