import { useColorScheme } from "react-native";
import { Colors, ThemeColors } from "@/src/constants/theme";
import { useAppSelector } from "@/src/store";

export function useTheme(): ThemeColors & {
  isDark: boolean;
  scheme: "light" | "dark";
} {
  const systemScheme = useColorScheme() ?? "light";
  const themePreference = useAppSelector((s) => s.settings.theme);
  const effectiveScheme =
    themePreference === "system" ? systemScheme : themePreference;
  const colors = Colors[effectiveScheme];
  return {
    ...colors,
    isDark: effectiveScheme === "dark",
    scheme: effectiveScheme,
  };
}
