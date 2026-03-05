// ─── QueuePro Futuristic Design System ──────────────────────────────
export const Colors = {
  light: {
    // Core
    primary: "#10B981",
    primaryLight: "#34D399",
    primaryDark: "#059669",
    accent: "#6366F1",
    accentLight: "#818CF8",

    // Surfaces
    background: "#F8FAFC",
    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",
    surfaceSecondary: "#F1F5F9",
    card: "#FFFFFF",

    // Text
    text: "#0F172A",
    textSecondary: "#64748B",
    textTertiary: "#94A3B8",
    textInverse: "#FFFFFF",

    // Semantic
    success: "#22C55E",
    successBg: "#F0FDF4",
    warning: "#F59E0B",
    warningBg: "#FFFBEB",
    error: "#EF4444",
    errorBg: "#FEF2F2",
    info: "#3B82F6",
    infoBg: "#EFF6FF",

    // Borders
    border: "#E2E8F0",
    borderLight: "#F1F5F9",
    divider: "#E2E8F0",

    // Status
    online: "#22C55E",
    offline: "#94A3B8",
    busy: "#F59E0B",

    // Gradient stops
    gradientStart: "#10B981",
    gradientEnd: "#059669",
    gradientAccent: "#6366F1",

    // Shadows
    shadowColor: "rgba(0, 0, 0, 0.08)",
    shadowColorStrong: "rgba(0, 0, 0, 0.15)",

    // Tab bar
    tabBar: "#FFFFFF",
    tabBarBorder: "#E2E8F0",
    tabActive: "#10B981",
    tabInactive: "#94A3B8",

    // Input
    inputBg: "#F8FAFC",
    inputBorder: "#E2E8F0",
    inputFocusBorder: "#10B981",
    placeholder: "#94A3B8",

    // Overlay
    overlay: "rgba(0, 0, 0, 0.5)",
    glassBg: "rgba(255, 255, 255, 0.85)",
  },
  dark: {
    // Core
    primary: "#34D399",
    primaryLight: "#6EE7B7",
    primaryDark: "#10B981",
    accent: "#818CF8",
    accentLight: "#A5B4FC",

    // Surfaces
    background: "#0A0A0F",
    surface: "#141419",
    surfaceElevated: "#1E1E26",
    surfaceSecondary: "#1A1A22",
    card: "#1A1A22",

    // Text
    text: "#F1F5F9",
    textSecondary: "#94A3B8",
    textTertiary: "#64748B",
    textInverse: "#0F172A",

    // Semantic
    success: "#4ADE80",
    successBg: "rgba(34, 197, 94, 0.12)",
    warning: "#FBBF24",
    warningBg: "rgba(245, 158, 11, 0.12)",
    error: "#F87171",
    errorBg: "rgba(239, 68, 68, 0.12)",
    info: "#60A5FA",
    infoBg: "rgba(59, 130, 246, 0.12)",

    // Borders
    border: "#2A2A35",
    borderLight: "#1E1E26",
    divider: "#2A2A35",

    // Status
    online: "#4ADE80",
    offline: "#64748B",
    busy: "#FBBF24",

    // Gradient stops
    gradientStart: "#34D399",
    gradientEnd: "#10B981",
    gradientAccent: "#818CF8",

    // Shadows
    shadowColor: "rgba(0, 0, 0, 0.3)",
    shadowColorStrong: "rgba(0, 0, 0, 0.5)",

    // Tab bar
    tabBar: "#141419",
    tabBarBorder: "#2A2A35",
    tabActive: "#34D399",
    tabInactive: "#64748B",

    // Input
    inputBg: "#1A1A22",
    inputBorder: "#2A2A35",
    inputFocusBorder: "#34D399",
    placeholder: "#64748B",

    // Overlay
    overlay: "rgba(0, 0, 0, 0.7)",
    glassBg: "rgba(20, 20, 25, 0.85)",
  },
};

export type ThemeColors = typeof Colors.light;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  "6xl": 64,
} as const;

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  full: 9999,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
  "5xl": 48,
} as const;

export const FontWeight = {
  light: "300" as const,
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  extrabold: "800" as const,
};

export const Shadow = {
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  xl: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  }),
};
