import React, { type PropsWithChildren } from "react";
import { View, StyleSheet, Dimensions, Platform } from "react-native";
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient, type LinearGradientProps } from "expo-linear-gradient";

import { useTheme } from "@/src/hooks/useTheme";
import { Spacing } from "@/src/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HEADER_HEIGHT = 260;

type ParallaxScrollViewProps = PropsWithChildren<{
  headerContent?: React.ReactNode;
  headerHeight?: number;
  gradientColors?: string[];
}>;

export function ParallaxScrollView({
  children,
  headerContent,
  headerHeight = HEADER_HEIGHT,
  gradientColors,
}: ParallaxScrollViewProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const scrollRef = useAnimatedRef<Animated.ScrollView>();

  const colors = gradientColors ?? [
    theme.primary,
    `${theme.primary}CC`,
    theme.background,
  ];

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollY.value,
            [-headerHeight, 0, headerHeight],
            [-headerHeight / 2, 0, headerHeight * 0.75],
          ),
        },
        {
          scale: interpolate(
            scrollY.value,
            [-headerHeight, 0, headerHeight],
            [2, 1, 1],
          ),
        },
      ],
      opacity: interpolate(scrollY.value, [0, headerHeight * 0.6], [1, 0]),
    };
  });

  const overlayStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scrollY.value, [0, headerHeight * 0.5], [0, 0.95]),
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Parallax Header */}
      <Animated.View
        style={[styles.header, { height: headerHeight }, headerAnimatedStyle]}
      >
        <LinearGradient
          colors={colors as unknown as LinearGradientProps["colors"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={[styles.headerContent, { paddingTop: insets.top }]}>
          {headerContent}
        </View>
      </Animated.View>

      {/* Scroll overlay */}
      <Animated.View
        style={[
          styles.overlay,
          { backgroundColor: theme.background, height: headerHeight },
          overlayStyle,
        ]}
        pointerEvents="none"
      />

      {/* Scrollable Content */}
      <Animated.ScrollView
        ref={scrollRef}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight, paddingBottom: insets.bottom + 100 },
        ]}
      >
        {children}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    overflow: "hidden",
  },
  headerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    zIndex: 3,
  },
});
