import React, { useRef, useState } from "react";
import { View, TextInput, StyleSheet, Keyboard } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/hooks/useTheme";
import {
  BorderRadius,
  FontSize,
  FontWeight,
  Spacing,
} from "@/src/constants/theme";

interface OtpInputProps {
  length?: number;
  onComplete: (code: string) => void;
  error?: boolean;
}

export function OtpInput({ length = 6, onComplete, error }: OtpInputProps) {
  const theme = useTheme();
  const [code, setCode] = useState<string[]>(Array(length).fill(""));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const shakeAnim = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeAnim.value }],
  }));

  React.useEffect(() => {
    if (error) {
      shakeAnim.value = withSequence(
        withSpring(-10, { damping: 2, stiffness: 500 }),
        withSpring(10, { damping: 2, stiffness: 500 }),
        withSpring(-10, { damping: 2, stiffness: 500 }),
        withSpring(0, { damping: 10, stiffness: 500 }),
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [error]);

  const handleChange = (text: string, index: number) => {
    const newCode = [...code];

    if (text.length > 1) {
      // Paste handling
      const chars = text.slice(0, length).split("");
      chars.forEach((char, i) => {
        if (index + i < length) newCode[index + i] = char;
      });
      setCode(newCode);
      const nextIndex = Math.min(index + chars.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
      setFocusedIndex(nextIndex);

      if (newCode.every((c) => c !== "")) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Keyboard.dismiss();
        onComplete(newCode.join(""));
      }
      return;
    }

    newCode[index] = text;
    setCode(newCode);

    if (text && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }

    if (newCode.every((c) => c !== "")) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Keyboard.dismiss();
      onComplete(newCode.join(""));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      const newCode = [...code];
      newCode[index - 1] = "";
      setCode(newCode);
      inputRefs.current[index - 1]?.focus();
      setFocusedIndex(index - 1);
    }
  };

  return (
    <Animated.View style={[styles.container, shakeStyle]}>
      {Array.from({ length }).map((_, index) => {
        const isFocused = focusedIndex === index;
        const hasValue = !!code[index];

        return (
          <View
            key={index}
            style={[
              styles.cell,
              {
                backgroundColor: theme.inputBg,
                borderColor: error
                  ? theme.error
                  : isFocused
                    ? theme.primary
                    : hasValue
                      ? theme.primaryLight
                      : theme.inputBorder,
                borderWidth: isFocused || error ? 2 : 1,
              },
            ]}
          >
            <TextInput
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={[styles.cellText, { color: theme.text }]}
              value={code[index]}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              onFocus={() => setFocusedIndex(index)}
              keyboardType="number-pad"
              maxLength={index === 0 ? length : 1}
              selectTextOnFocus
              autoFocus={index === 0}
            />
          </View>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  cell: {
    width: 48,
    height: 56,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  cellText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    textAlign: "center",
    width: "100%",
    height: "100%",
    textAlignVertical: "center",
  },
});
