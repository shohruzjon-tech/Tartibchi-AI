import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from "react-native-reanimated";
import { useTheme } from "@/src/hooks/useTheme";
import {
  BorderRadius,
  FontSize,
  FontWeight,
  Shadow,
  Spacing,
} from "@/src/constants/theme";

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  style?: ViewStyle;
  elevated?: boolean;
  index?: number;
  headerRight?: React.ReactNode;
  noPadding?: boolean;
}

export function Card({
  children,
  title,
  subtitle,
  style,
  elevated = false,
  index = 0,
  headerRight,
  noPadding = false,
}: CardProps) {
  const theme = useTheme();

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80)
        .springify()
        .damping(18)}
      style={[
        styles.card,
        {
          backgroundColor: elevated ? theme.surfaceElevated : theme.card,
          shadowColor: theme.shadowColor,
        },
        elevated ? Shadow.lg : Shadow.sm,
        style,
      ]}
    >
      {(title || headerRight) && (
        <View style={styles.header}>
          <View style={styles.headerText}>
            {title && (
              <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
            )}
            {subtitle && (
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                {subtitle}
              </Text>
            )}
          </View>
          {headerRight}
        </View>
      )}
      <View style={noPadding ? undefined : styles.content}>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  subtitle: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  content: {
    padding: Spacing.lg,
  },
});
