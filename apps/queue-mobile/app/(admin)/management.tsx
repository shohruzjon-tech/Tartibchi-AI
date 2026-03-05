import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/src/hooks/useTheme";
import { useAppSelector, useAppDispatch } from "@/src/store";
import { addAlert } from "@/src/store/slices/alertSlice";
import { api } from "@/src/services/api";
import {
  Card,
  Badge,
  Button,
  BottomSheet,
  EmptyState,
  LoadingOverlay,
  ConfirmDialog,
} from "@/src/components/ui";
import {
  FontSize,
  FontWeight,
  Spacing,
  BorderRadius,
  Shadow,
} from "@/src/constants/theme";
import { BranchForm } from "@/src/components/forms/BranchForm";
import { QueueForm } from "@/src/components/forms/QueueForm";
import { CounterForm } from "@/src/components/forms/CounterForm";
import { EmployeeForm } from "@/src/components/forms/EmployeeForm";
import { CustomerForm } from "@/src/components/forms/CustomerForm";
import { AppointmentForm } from "@/src/components/forms/AppointmentForm";

type Section =
  | "services"
  | "counters"
  | "branches"
  | "employees"
  | "customers"
  | "appointments"
  | "solo-services";

export default function ManagementScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { user, token } = useAppSelector((s) => s.auth);
  const isSolo = user?.tenantMode === "SOLO";

  const [activeSection, setActiveSection] = useState<Section>(
    isSolo ? "appointments" : "services",
  );
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const sections: {
    key: Section;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = isSolo
    ? [
        {
          key: "appointments",
          label: t("sidebar.appointments"),
          icon: "calendar",
        },
        {
          key: "solo-services",
          label: t("sidebar.services"),
          icon: "clipboard",
        },
        { key: "customers", label: t("sidebar.customers"), icon: "people" },
      ]
    : [
        { key: "services", label: t("sidebar.services"), icon: "clipboard" },
        { key: "counters", label: t("sidebar.counters"), icon: "desktop" },
        { key: "branches", label: t("sidebar.branches"), icon: "business" },
        { key: "employees", label: t("sidebar.staff"), icon: "people" },
        { key: "customers", label: t("sidebar.customers"), icon: "person" },
      ];

  const fetchSection = useCallback(async () => {
    setLoading(true);
    try {
      let result: any;
      switch (activeSection) {
        case "services":
        case "solo-services":
          result = await api.queues.list({});
          break;
        case "counters":
          result = await api.counters.list({}, token!);
          break;
        case "branches":
          result = await api.branches.list(user?.tenantId ?? "", token!);
          break;
        case "employees":
          result = await api.employees.list({}, token!);
          break;
        case "customers":
          result = await api.customers.list({}, token!);
          break;
        case "appointments":
          result = await api.appointments.list({}, token!);
          break;
      }
      setData(
        Array.isArray(result) ? result : (result?.data ?? result?.items ?? []),
      );
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
      setRefreshing(false);
    }
  }, [activeSection]);

  useEffect(() => {
    fetchSection();
  }, [fetchSection]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSection();
  };

  const handleCreate = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      switch (activeSection) {
        case "services":
        case "solo-services":
          await api.queues.delete(deleteTarget.id, token!);
          break;
        case "counters":
          await api.counters.delete(deleteTarget.id, token!);
          break;
        case "branches":
          await api.branches.delete(deleteTarget.id, token!);
          break;
        case "customers":
          await api.customers.delete(deleteTarget.id, token!);
          break;
        case "appointments":
          await api.appointments.cancel(deleteTarget.id, token!);
          break;
      }
      dispatch(
        addAlert({
          type: "success",
          title: t("common.success"),
          message: t("common.deleted"),
        }),
      );
      setDeleteTarget(null);
      fetchSection();
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

  const handleFormSubmit = async (formData: any) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      switch (activeSection) {
        case "services":
        case "solo-services":
          editingItem
            ? await api.queues.update(editingItem.id, formData, token!)
            : await api.queues.create(formData, token!);
          break;
        case "counters":
          editingItem
            ? await api.counters.update(editingItem.id, formData, token!)
            : await api.counters.create(formData, token!);
          break;
        case "branches":
          editingItem
            ? await api.branches.update(editingItem.id, formData, token!)
            : await api.branches.create(formData, token!);
          break;
        case "employees":
          editingItem
            ? await api.employees.update(editingItem.id, formData, token!)
            : await api.employees.create(formData, token!);
          break;
        case "customers":
          editingItem
            ? await api.customers.update(editingItem.id, formData, token!)
            : await api.customers.create(formData, token!);
          break;
        case "appointments":
          editingItem
            ? await api.appointments.update(editingItem.id, formData, token!)
            : await api.appointments.create(formData, token!);
          break;
      }
      dispatch(
        addAlert({
          type: "success",
          title: t("common.success"),
          message: editingItem ? t("common.updated") : t("common.created"),
        }),
      );
      setShowForm(false);
      setEditingItem(null);
      fetchSection();
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

  const renderItem = (item: any, index: number) => {
    const titleKey =
      item.name ||
      item.firstName ||
      item.displayNumber ||
      item.phone ||
      `#${index + 1}`;
    const subtitleKey =
      item.address || item.email || item.queueName || item.status || "";

    return (
      <Animated.View
        key={item.id ?? index}
        entering={FadeInRight.delay(index * 60).springify()}
      >
        <TouchableOpacity
          style={[
            styles.listItem,
            { backgroundColor: theme.card, borderColor: theme.border },
            Shadow.sm,
          ]}
          onPress={() => handleEdit(item)}
          activeOpacity={0.7}
        >
          <View style={styles.listItemContent}>
            <Text
              style={[styles.itemTitle, { color: theme.text }]}
              numberOfLines={1}
            >
              {titleKey}
            </Text>
            {subtitleKey ? (
              <Text
                style={[styles.itemSub, { color: theme.textTertiary }]}
                numberOfLines={1}
              >
                {subtitleKey}
              </Text>
            ) : null}
          </View>
          {item.isActive !== undefined && (
            <Badge
              variant={item.isActive ? "success" : "default"}
              text={item.isActive ? "Active" : "Inactive"}
            />
          )}
          {item.status && <Badge variant="info" text={item.status} />}
          <View style={styles.itemActions}>
            <TouchableOpacity onPress={() => handleEdit(item)} hitSlop={8}>
              <Ionicons name="create-outline" size={18} color={theme.primary} />
            </TouchableOpacity>
            {activeSection !== "employees" && (
              <TouchableOpacity
                onPress={() => setDeleteTarget(item)}
                hitSlop={8}
              >
                <Ionicons name="trash-outline" size={18} color={theme.error} />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const FormComponent = (() => {
    switch (activeSection) {
      case "services":
      case "solo-services":
        return QueueForm;
      case "counters":
        return CounterForm;
      case "branches":
        return BranchForm;
      case "employees":
        return EmployeeForm;
      case "customers":
        return CustomerForm;
      case "appointments":
        return AppointmentForm;
      default:
        return null;
    }
  })();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Section Tabs */}
      <View style={{ paddingTop: insets.top + Spacing.sm }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
          {sections.map((s) => (
            <TouchableOpacity
              key={s.key}
              style={[
                styles.tab,
                {
                  backgroundColor:
                    activeSection === s.key ? theme.primary : theme.surface,
                  borderColor:
                    activeSection === s.key ? theme.primary : theme.border,
                },
              ]}
              onPress={() => {
                setActiveSection(s.key);
                Haptics.selectionAsync();
              }}
            >
              <Ionicons
                name={s.icon}
                size={16}
                color={activeSection === s.key ? "#fff" : theme.textSecondary}
              />
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeSection === s.key ? "#fff" : theme.textSecondary,
                  },
                ]}
              >
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <LoadingOverlay visible />
        ) : data.length === 0 ? (
          <EmptyState
            icon="folder-open"
            title={t("common.noData")}
            message={t("common.noDataDescription")}
            action={{ title: t("common.create"), onPress: handleCreate }}
          />
        ) : (
          <View style={styles.list}>
            {data.map((item, i) => renderItem(item, i))}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      {!loading && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.primary }, Shadow.lg]}
          onPress={handleCreate}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Form BottomSheet */}
      {showForm && FormComponent && (
        <BottomSheet
          visible
          onClose={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
        >
          <FormComponent
            initialData={editingItem}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingItem(null);
            }}
          />
        </BottomSheet>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        visible={!!deleteTarget}
        title={t("common.confirmDelete")}
        message={t("common.confirmDeleteMessage")}
        confirmText={t("common.delete")}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
        variant="danger"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabs: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 6,
  },
  tabText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
  list: { gap: Spacing.sm },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  listItemContent: { flex: 1 },
  itemTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  itemSub: { fontSize: FontSize.sm, marginTop: 2 },
  itemActions: { flexDirection: "row", gap: Spacing.sm },
  fab: {
    position: "absolute",
    bottom: 100,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
});
