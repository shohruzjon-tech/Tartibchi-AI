import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  interpolate,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface FloatingParticle {
  size: number;
  x: number;
  delay: number;
  duration: number;
  color: string;
}

const PARTICLES: FloatingParticle[] = Array.from({ length: 12 }, (_, i) => ({
  size: 4 + Math.random() * 8,
  x: Math.random() * SCREEN_WIDTH,
  delay: i * 300,
  duration: 3000 + Math.random() * 4000,
  color: ["#10B981", "#6366F1", "#F59E0B", "#EF4444", "#8B5CF6"][i % 5],
}));

/**
 * Floating particles background decoration.
 * Adds a subtle premium feel to screens.
 */
export function FloatingParticles() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {PARTICLES.map((p, i) => (
        <Particle key={i} {...p} />
      ))}
    </View>
  );
}

function Particle({ size, x, delay, duration, color }: FloatingParticle) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      progress.value,
      [0, 1],
      [SCREEN_HEIGHT, -50],
    );
    const opacity = interpolate(
      progress.value,
      [0, 0.2, 0.8, 1],
      [0, 0.5, 0.5, 0],
    );
    const scale = interpolate(progress.value, [0, 0.5, 1], [0.5, 1, 0.5]);

    return {
      transform: [{ translateY }, { scale }],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: x,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animStyle,
      ]}
    />
  );
}

/**
 * Gradient orb decoration for auth/onboarding screens.
 */
export function GradientOrbs() {
  const pulse1 = useSharedValue(1);
  const pulse2 = useSharedValue(1);

  useEffect(() => {
    pulse1.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
    pulse2.value = withDelay(
      2000,
      withRepeat(
        withSequence(
          withTiming(1.3, {
            duration: 5000,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
      ),
    );
  }, []);

  const orb1Style = useAnimatedStyle(() => ({
    transform: [{ scale: pulse1.value }],
  }));

  const orb2Style = useAnimatedStyle(() => ({
    transform: [{ scale: pulse2.value }],
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View
        style={[
          {
            position: "absolute",
            top: -80,
            right: -60,
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: "rgba(16, 185, 129, 0.08)",
          },
          orb1Style,
        ]}
      />
      <Animated.View
        style={[
          {
            position: "absolute",
            bottom: 100,
            left: -80,
            width: 250,
            height: 250,
            borderRadius: 125,
            backgroundColor: "rgba(99, 102, 241, 0.06)",
          },
          orb2Style,
        ]}
      />
    </View>
  );
}
