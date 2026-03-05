import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/src/hooks/useTheme";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { setSelectedWorkspace, setRoles } from "@/src/store/slices/authSlice";
import { addAlert } from "@/src/store/slices/alertSlice";
import { api } from "@/src/services/api";
import { GradientOrbs } from "@/src/components/ui/AnimatedBackgrounds";
import {
  FontSize,
  FontWeight,
  Spacing,
  BorderRadius,
  Shadow,
} from "@/src/constants/theme";

export default function SelectWorkspaceScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { workspaces, sessionToken } = useAppSelector((s) => s.auth);
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelect = async (workspaceId: string) => {
    try {
      setLoading(workspaceId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const result = await api.auth.selectWorkspace(
        { workspaceId },
        sessionToken!,
      );

      if (result.roles) {
        dispatch(setSelectedWorkspace(workspaceId));
        dispatch(setRoles(result.roles));
        router.push("/(auth)/select-role");
      } else if (result.accessToken) {
        const { setAuth } = await import("@/src/store/slices/authSlice");
        const { SecureStorage } = await import("@/src/services/secure-storage");
        dispatch(setAuth(result));
        await SecureStorage.setTokens(result.accessToken, result.refreshToken);
        router.replace("/");
      }
    } catch (err: any) {
      dispatch(
        addAlert({
          type: "error",
          title: t("common.error"),
          message: err.message,
        }),
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background, paddingTop: insets.top + 20 },
      ]}
    >
      <GradientOrbs />
      <Animated.View
        entering={FadeInDown.delay(100).springify()}
        style={styles.header}
      >
        <View
          style={[styles.iconWrap, { backgroundColor: `${theme.accent}15` }]}
        >
          <Ionicons name="grid" size={36} color={theme.accent} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>
          {t("auth.selectWorkspace")}
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {t("auth.selectWorkspaceSubtitle")}
        </Text>
      </Animated.View>

      <FlatList
        data={workspaces}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInRight.delay(200 + index * 100).springify()}
          >
            <TouchableOpacity
              style={[
                styles.card,
                {
                  backgroundColor: theme.card,
                  borderColor:
                    loading === item.id ? theme.primary : theme.border,
                  shadowColor: theme.shadowColor,
                },
                Shadow.md,
              ]}
              onPress={() => handleSelect(item.id)}
              disabled={!!loading}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.cardIcon,
                  { backgroundColor: `${theme.primary}15` },
                ]}
              >
                <Ionicons name="business" size={24} color={theme.primary} />
              </View>
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  {item.name}
                </Text>
                {item.mode && (
                  <Text
                    style={[styles.cardMode, { color: theme.textTertiary }]}
                  >
                    {item.mode} mode
                  </Text>
                )}
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.textTertiary}
              />
            </TouchableOpacity>
          </Animated.View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing["2xl"],
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.xl,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize["2xl"],
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  subtitle: { fontSize: FontSize.md },
  list: { paddingHorizontal: Spacing.xl, gap: Spacing.md },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    gap: Spacing.md,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  cardMode: { fontSize: FontSize.sm, marginTop: 2 },
});
