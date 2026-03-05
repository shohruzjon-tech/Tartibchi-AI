import { useEffect } from "react";
import { router } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useAppSelector } from "@/src/store";
import { useTheme } from "@/src/hooks/useTheme";
import { UserRole } from "@/src/types";

export default function Index() {
  const theme = useTheme();
  const { token, user } = useAppSelector((s) => s.auth);
  const { token: staffToken } = useAppSelector((s) => s.staff);

  useEffect(() => {
    const navigate = () => {
      if (staffToken) {
        router.replace("/(staff)/workstation");
        return;
      }

      if (!token || !user) {
        router.replace("/(auth)/login");
        return;
      }

      if (!user.onboardingCompleted) {
        router.replace("/(onboarding)");
        return;
      }

      switch (user.role) {
        case UserRole.TENANT_ADMIN:
          router.replace("/(admin)/dashboard");
          break;
        case UserRole.BRANCH_MANAGER:
          router.replace("/(manager)/overview");
          break;
        case UserRole.STAFF:
          router.replace("/(staff)/workstation");
          break;
        default:
          router.replace("/(auth)/login");
      }
    };

    const timer = setTimeout(navigate, 100);
    return () => clearTimeout(timer);
  }, [token, user, staffToken]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
