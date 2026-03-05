import React, { useEffect } from "react";
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
import { useTheme } from "@/src/hooks/useTheme";
import {
  BorderRadius,
  FontSize,
  FontWeight,
  Spacing,
} from "@/src/constants/theme";

const AnimatedView = Animated.createAnimatedComponent(View);

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  containerStyle,
  ...props
}: InputProps) {
  const theme = useTheme();
  const focusAnim = useSharedValue(0);
  const errorAnim = useSharedValue(0);

  useEffect(() => {
    errorAnim.value = withTiming(error ? 1 : 0, { duration: 200 });
  }, [error]);

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      errorAnim.value > 0 ? 2 : focusAnim.value,
      [0, 1, 2],
      [theme.inputBorder, theme.primary, theme.error],
    ),
    borderWidth: focusAnim.value > 0 || errorAnim.value > 0 ? 1.5 : 1,
  }));

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          {label}
        </Text>
      )}
      <AnimatedView
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.inputBg,
            borderColor: theme.inputBorder,
          },
          borderStyle,
        ]}
      >
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        <TextInput
          {...props}
          placeholderTextColor={theme.placeholder}
          style={[
            styles.input,
            {
              color: theme.text,
              fontSize: FontSize.md,
            },
            leftIcon ? { paddingLeft: 0 } : null,
            rightIcon ? { paddingRight: 0 } : null,
            props.style,
          ]}
          onFocus={(e) => {
            focusAnim.value = withTiming(1, { duration: 200 });
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            focusAnim.value = withTiming(0, { duration: 200 });
            props.onBlur?.(e);
          }}
        />
        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
      </AnimatedView>
      {error && (
        <Text style={[styles.error, { color: theme.error }]}>{error}</Text>
      )}
      {hint && !error && (
        <Text style={[styles.hint, { color: theme.textTertiary }]}>{hint}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontWeight: FontWeight.regular,
  },
  iconLeft: {
    paddingLeft: Spacing.md,
  },
  iconRight: {
    paddingRight: Spacing.md,
  },
  error: {
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  hint: {
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
});
