import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/hooks/useTheme";
import {
  BorderRadius,
  FontSize,
  FontWeight,
  Shadow,
  Spacing,
} from "@/src/constants/theme";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  trend?: { value: number; isUp: boolean };
  index?: number;
  style?: ViewStyle;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
  trend,
  index = 0,
  style,
}: StatCardProps) {
  const theme = useTheme();
  const iconColor = color || theme.primary;

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 100)
        .springify()
        .damping(18)}
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          shadowColor: theme.shadowColor,
        },
        Shadow.md,
        style,
      ]}
    >
      <View style={styles.header}>
        <View
          style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}
        >
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        {trend && (
          <View
            style={[
              styles.trendBadge,
              {
                backgroundColor: trend.isUp ? theme.successBg : theme.errorBg,
              },
            ]}
          >
            <Ionicons
              name={trend.isUp ? "trending-up" : "trending-down"}
              size={12}
              color={trend.isUp ? theme.success : theme.error}
            />
            <Text
              style={[
                styles.trendText,
                { color: trend.isUp ? theme.success : theme.error },
              ]}
            >
              {trend.value}%
            </Text>
          </View>
        )}
      </View>
      <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.title, { color: theme.textSecondary }]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: theme.textTertiary }]}>
          {subtitle}
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    minWidth: 150,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    gap: 2,
  },
  trendText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  value: {
    fontSize: FontSize["2xl"],
    fontWeight: FontWeight.bold,
    marginBottom: 2,
  },
  title: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  subtitle: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
});
