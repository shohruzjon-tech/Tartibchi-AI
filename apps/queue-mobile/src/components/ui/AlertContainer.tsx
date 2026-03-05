import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutUp,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/hooks/useTheme";
import {
  BorderRadius,
  FontSize,
  FontWeight,
  Shadow,
  Spacing,
} from "@/src/constants/theme";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { removeAlert, AlertType } from "@/src/store/slices/alertSlice";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ICONS: Record<AlertType, keyof typeof Ionicons.glyphMap> = {
  success: "checkmark-circle",
  error: "close-circle",
  warning: "warning",
  info: "information-circle",
};

export function AlertContainer() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const alerts = useAppSelector((s) => s.alerts.alerts);
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    alerts.forEach((alert) => {
      const duration = alert.duration ?? 5000;
      if (duration > 0) {
        const timer = setTimeout(() => {
          dispatch(removeAlert(alert.id));
        }, duration);
        return () => clearTimeout(timer);
      }
    });
  }, [alerts]);

  if (alerts.length === 0) return null;

  return (
    <View style={[styles.container, { top: insets.top + Spacing.sm }]}>
      {alerts.map((alert) => {
        const color =
          alert.type === "success"
            ? theme.success
            : alert.type === "error"
              ? theme.error
              : alert.type === "warning"
                ? theme.warning
                : theme.info;

        const bgColor =
          alert.type === "success"
            ? theme.successBg
            : alert.type === "error"
              ? theme.errorBg
              : alert.type === "warning"
                ? theme.warningBg
                : theme.infoBg;

        return (
          <Animated.View
            key={alert.id}
            entering={SlideInUp.springify().damping(18)}
            exiting={SlideOutUp.duration(200)}
            style={[
              styles.alert,
              {
                backgroundColor: theme.card,
                borderColor: color,
                borderLeftWidth: 4,
                shadowColor: theme.shadowColor,
              },
              Shadow.lg,
            ]}
          >
            <Ionicons name={ICONS[alert.type]} size={22} color={color} />
            <View style={styles.alertContent}>
              <Text style={[styles.alertTitle, { color: theme.text }]}>
                {alert.title}
              </Text>
              {alert.message && (
                <Text
                  style={[styles.alertMessage, { color: theme.textSecondary }]}
                >
                  {alert.message}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => dispatch(removeAlert(alert.id))}
              hitSlop={12}
            >
              <Ionicons name="close" size={18} color={theme.textTertiary} />
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 9999,
    gap: Spacing.sm,
  },
  alert: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  alertMessage: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
});
