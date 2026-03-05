import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/hooks/useTheme";
import {
  BorderRadius,
  FontSize,
  FontWeight,
  Spacing,
} from "@/src/constants/theme";
import { Button } from "./Button";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapPoints?: number[];
}

export function BottomSheet({
  visible,
  onClose,
  title,
  children,
}: BottomSheetProps) {
  const theme = useTheme();

  if (!visible) return null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <TouchableOpacity
          style={styles.overlayTouch}
          onPress={onClose}
          activeOpacity={1}
        />
        <Animated.View
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(250)}
          style={[
            styles.sheet,
            {
              backgroundColor: theme.surface,
              borderTopLeftRadius: BorderRadius["2xl"],
              borderTopRightRadius: BorderRadius["2xl"],
            },
          ]}
        >
          <View style={styles.handle}>
            <View
              style={[styles.handleBar, { backgroundColor: theme.border }]}
            />
          </View>
          {title && (
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: theme.text }]}>
                {title}
              </Text>
              <TouchableOpacity onPress={onClose} hitSlop={12}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
          <ScrollView
            style={styles.sheetContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Confirm Dialog ──────────────────────────────────────────────────
interface ConfirmDialogProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
}

export function ConfirmDialog({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
  loading,
}: ConfirmDialogProps) {
  const theme = useTheme();

  if (!visible) return null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View
        style={[
          styles.overlay,
          { backgroundColor: theme.overlay, justifyContent: "center" },
        ]}
      >
        <Animated.View
          entering={FadeIn.duration(250)}
          exiting={FadeOut.duration(200)}
          style={[
            styles.dialog,
            {
              backgroundColor: theme.surface,
            },
          ]}
        >
          <Text style={[styles.dialogTitle, { color: theme.text }]}>
            {title}
          </Text>
          <Text style={[styles.dialogMessage, { color: theme.textSecondary }]}>
            {message}
          </Text>
          <View style={styles.dialogActions}>
            <Button
              title={cancelText}
              onPress={onClose}
              variant="ghost"
              size="sm"
              style={{ flex: 1 }}
            />
            <Button
              title={confirmText}
              onPress={onConfirm}
              variant={variant === "danger" ? "danger" : "primary"}
              size="sm"
              loading={loading}
              style={{ flex: 1 }}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────
interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  action?: { title: string; onPress: () => void };
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={styles.emptyContainer}>
      <View
        style={[styles.emptyIcon, { backgroundColor: `${theme.primary}10` }]}
      >
        <Ionicons name={icon} size={48} color={theme.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>{title}</Text>
      {message && (
        <Text style={[styles.emptyMessage, { color: theme.textSecondary }]}>
          {message}
        </Text>
      )}
      {action && (
        <Button
          title={action.title}
          onPress={action.onPress}
          variant="outline"
          size="sm"
          style={{ marginTop: Spacing.lg }}
        />
      )}
    </View>
  );
}

// ─── Badge ───────────────────────────────────────────────────────────
interface BadgeProps {
  text: string;
  variant?: "primary" | "success" | "warning" | "error" | "info" | "default";
}

export function Badge({ text, variant = "default" }: BadgeProps) {
  const theme = useTheme();

  const getColors = () => {
    switch (variant) {
      case "primary":
        return { bg: `${theme.primary}20`, text: theme.primary };
      case "success":
        return { bg: theme.successBg, text: theme.success };
      case "warning":
        return { bg: theme.warningBg, text: theme.warning };
      case "error":
        return { bg: theme.errorBg, text: theme.error };
      case "info":
        return { bg: theme.infoBg, text: theme.info };
      default:
        return { bg: theme.surfaceSecondary, text: theme.textSecondary };
    }
  };

  const colors = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.badgeText, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

// ─── Loading Overlay ─────────────────────────────────────────────────
interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message }: LoadingOverlayProps) {
  const theme = useTheme();
  if (!visible) return null;

  return (
    <View style={[styles.loadingOverlay, { backgroundColor: theme.overlay }]}>
      <View style={[styles.loadingBox, { backgroundColor: theme.surface }]}>
        <Animated.View entering={FadeIn} style={styles.loadingSpinner}>
          <Ionicons name="sync" size={32} color={theme.primary} />
        </Animated.View>
        {message && (
          <Text style={[styles.loadingText, { color: theme.text }]}>
            {message}
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────
export function Divider({ style }: { style?: any }) {
  const theme = useTheme();
  return (
    <View style={[styles.divider, { backgroundColor: theme.divider }, style]} />
  );
}

const styles = StyleSheet.create({
  // Bottom Sheet
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  overlayTouch: {
    flex: 1,
  },
  sheet: {
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  handle: {
    alignItems: "center",
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  sheetTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  sheetContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing["3xl"],
  },

  // Dialog
  dialog: {
    marginHorizontal: Spacing["3xl"],
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
  },
  dialogTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  dialogMessage: {
    fontSize: FontSize.md,
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  dialogActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },

  // Empty State
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["5xl"],
    paddingHorizontal: Spacing["3xl"],
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  emptyMessage: {
    fontSize: FontSize.md,
    textAlign: "center",
    lineHeight: 22,
  },

  // Badge
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },

  // Loading
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  loadingBox: {
    padding: Spacing["3xl"],
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    gap: Spacing.md,
  },
  loadingSpinner: {},
  loadingText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },

  // Divider
  divider: {
    height: 1,
    width: "100%",
  },
});
