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
import { setAuth, clearAuth } from "@/src/store/slices/authSlice";
import { addAlert } from "@/src/store/slices/alertSlice";
import { api } from "@/src/services/api";
import { GradientOrbs } from "@/src/components/ui/AnimatedBackgrounds";
import { SecureStorage } from "@/src/services/secure-storage";
import {
  FontSize,
  FontWeight,
  Spacing,
  BorderRadius,
  Shadow,
} from "@/src/constants/theme";
import { UserRole } from "@/src/types";

const ROLE_META: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  TENANT_ADMIN: { icon: "shield-checkmark", color: "#10B981" },
  BRANCH_MANAGER: { icon: "storefront", color: "#6366F1" },
  STAFF: { icon: "headset", color: "#F59E0B" },
};

export default function SelectRoleScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { roles, sessionToken, selectedWorkspaceId } = useAppSelector(
    (s) => s.auth,
  );
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelect = async (role: string) => {
    try {
      setLoading(role);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const result = await api.auth.selectRole(
        { workspaceId: selectedWorkspaceId!, role },
        sessionToken!,
      );

      dispatch(setAuth(result));
      await SecureStorage.setTokens(result.accessToken, result.refreshToken);

      router.replace("/");
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
          <Ionicons name="people" size={36} color={theme.accent} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>
          {t("auth.selectRole")}
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {t("auth.selectRoleSubtitle")}
        </Text>
      </Animated.View>

      <FlatList
        data={roles}
        keyExtractor={(item) => item.role}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => {
          const meta = ROLE_META[item.role] ?? {
            icon: "person",
            color: theme.primary,
          };
          return (
            <Animated.View
              entering={FadeInRight.delay(200 + index * 100).springify()}
            >
              <TouchableOpacity
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.card,
                    borderColor:
                      loading === item.role ? meta.color : theme.border,
                    shadowColor: theme.shadowColor,
                  },
                  Shadow.md,
                ]}
                onPress={() => handleSelect(item.role)}
                disabled={!!loading}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.cardIcon,
                    { backgroundColor: `${meta.color}15` },
                  ]}
                >
                  <Ionicons name={meta.icon} size={26} color={meta.color} />
                </View>
                <View style={styles.cardContent}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>
                    {t(`common.${item.role.toLowerCase()}`)}
                  </Text>
                  {item.branchName && (
                    <Text
                      style={[styles.cardSub, { color: theme.textTertiary }]}
                    >
                      {item.branchName}
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
          );
        }}
      />

      <TouchableOpacity style={[styles.backBtn]} onPress={() => router.back()}>
        <Text style={[styles.backText, { color: theme.textSecondary }]}>
          {t("common.back")}
        </Text>
      </TouchableOpacity>
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
  subtitle: { fontSize: FontSize.md, textAlign: "center" },
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
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  cardSub: { fontSize: FontSize.sm, marginTop: 2 },
  backBtn: { alignSelf: "center", paddingVertical: Spacing.lg },
  backText: { fontSize: FontSize.md },
});
