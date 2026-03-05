import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/src/hooks/useTheme";
import { useAppDispatch } from "@/src/store";
import { addAlert } from "@/src/store/slices/alertSlice";
import {
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

interface CrudListScreenProps {
  titleKey: string;
  fetchFn: () => Promise<any>;
  createFn?: (data: any) => Promise<any>;
  updateFn?: (id: string, data: any) => Promise<any>;
  deleteFn?: (id: string) => Promise<any>;
  FormComponent: React.ComponentType<{
    initialData?: any;
    onSubmit: (d: any) => void;
    onCancel: () => void;
  }>;
  getItemTitle: (item: any) => string;
  getItemSubtitle?: (item: any) => string;
}

export function CrudListScreen({
  titleKey,
  fetchFn,
  createFn,
  updateFn,
  deleteFn,
  FormComponent,
  getItemTitle,
  getItemSubtitle,
}: CrudListScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const fetch = useCallback(async () => {
    try {
      const result = await fetchFn();
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
  }, [fetchFn]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleSubmit = async (formData: any) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (editingItem && updateFn) {
        await updateFn(editingItem.id, formData);
      } else if (createFn) {
        await createFn(formData);
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
      fetch();
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

  const handleDelete = async () => {
    if (!deleteTarget || !deleteFn) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await deleteFn(deleteTarget.id);
      dispatch(
        addAlert({
          type: "success",
          title: t("common.success"),
          message: t("common.deleted"),
        }),
      );
      setDeleteTarget(null);
      fetch();
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
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + Spacing.md },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetch();
            }}
            tintColor={theme.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Text style={[styles.title, { color: theme.text }]}>
            {t(titleKey)}
          </Text>
        </Animated.View>

        {loading ? (
          <LoadingOverlay visible={loading} />
        ) : data.length === 0 ? (
          <EmptyState
            icon="folder-open"
            title={t("common.noData")}
            message={t("common.noDataDescription")}
            action={
              createFn
                ? {
                    title: t("common.create"),
                    onPress: () => {
                      setEditingItem(null);
                      setShowForm(true);
                    },
                  }
                : undefined
            }
          />
        ) : (
          <View style={styles.list}>
            {data.map((item, i) => (
              <Animated.View
                key={item.id ?? i}
                entering={FadeInRight.delay(i * 60).springify()}
              >
                <TouchableOpacity
                  style={[
                    styles.item,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    Shadow.sm,
                  ]}
                  onPress={() => {
                    setEditingItem(item);
                    setShowForm(true);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.itemTitle, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {getItemTitle(item)}
                    </Text>
                    {getItemSubtitle?.(item) ? (
                      <Text
                        style={[styles.itemSub, { color: theme.textTertiary }]}
                        numberOfLines={1}
                      >
                        {getItemSubtitle(item)}
                      </Text>
                    ) : null}
                  </View>
                  {item.isActive !== undefined && (
                    <Badge
                      variant={item.isActive ? "success" : "default"}
                      text={item.isActive ? "Active" : "Inactive"}
                    />
                  )}
                  <View style={styles.actions}>
                    <TouchableOpacity
                      hitSlop={8}
                      onPress={() => {
                        setEditingItem(item);
                        setShowForm(true);
                      }}
                    >
                      <Ionicons
                        name="create-outline"
                        size={18}
                        color={theme.primary}
                      />
                    </TouchableOpacity>
                    {deleteFn && (
                      <TouchableOpacity
                        hitSlop={8}
                        onPress={() => setDeleteTarget(item)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color={theme.error}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      {createFn && !loading && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.primary }, Shadow.lg]}
          onPress={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {showForm && (
        <BottomSheet
          visible
          onClose={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
        >
          <FormComponent
            initialData={editingItem}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingItem(null);
            }}
          />
        </BottomSheet>
      )}

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
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
  title: {
    fontSize: FontSize["2xl"],
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.lg,
  },
  list: { gap: Spacing.sm },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  itemTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  itemSub: { fontSize: FontSize.sm, marginTop: 2 },
  actions: { flexDirection: "row", gap: Spacing.sm },
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
