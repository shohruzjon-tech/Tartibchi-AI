import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/hooks/useTheme";
import {
  BorderRadius,
  FontSize,
  FontWeight,
  Spacing,
} from "@/src/constants/theme";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  haptic?: boolean;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  iconRight,
  fullWidth = false,
  style,
  textStyle,
  haptic = true,
}: ButtonProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const getContainerStyle = (): ViewStyle => {
    const base: ViewStyle = {
      borderRadius: BorderRadius.lg,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.sm,
    };

    // Size
    switch (size) {
      case "sm":
        base.paddingHorizontal = Spacing.lg;
        base.paddingVertical = Spacing.sm;
        break;
      case "lg":
        base.paddingHorizontal = Spacing["3xl"];
        base.paddingVertical = Spacing.lg;
        break;
      default:
        base.paddingHorizontal = Spacing.xl;
        base.paddingVertical = Spacing.md;
    }

    // Variant
    switch (variant) {
      case "primary":
        base.backgroundColor = theme.primary;
        break;
      case "secondary":
        base.backgroundColor = theme.surfaceSecondary;
        break;
      case "ghost":
        base.backgroundColor = "transparent";
        break;
      case "danger":
        base.backgroundColor = theme.error;
        break;
      case "outline":
        base.backgroundColor = "transparent";
        base.borderWidth = 1.5;
        base.borderColor = theme.primary;
        break;
    }

    if (disabled || loading) {
      base.opacity = 0.5;
    }

    if (fullWidth) {
      base.width = "100%";
    }

    return base;
  };

  const getTextStyle = (): TextStyle => {
    const base: TextStyle = {
      fontWeight: FontWeight.semibold,
    };

    switch (size) {
      case "sm":
        base.fontSize = FontSize.sm;
        break;
      case "lg":
        base.fontSize = FontSize.lg;
        break;
      default:
        base.fontSize = FontSize.md;
    }

    switch (variant) {
      case "primary":
      case "danger":
        base.color = "#FFFFFF";
        break;
      case "secondary":
        base.color = theme.text;
        break;
      case "ghost":
        base.color = theme.primary;
        break;
      case "outline":
        base.color = theme.primary;
        break;
    }

    return base;
  };

  return (
    <AnimatedTouchable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[getContainerStyle(), animatedStyle, style]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === "primary" || variant === "danger"
              ? "#FFF"
              : theme.primary
          }
        />
      ) : (
        <>
          {icon}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
          {iconRight}
        </>
      )}
    </AnimatedTouchable>
  );
}
