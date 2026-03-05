import React from "react";
import { Stack } from "expo-router";

export default function StaffLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    >
      <Stack.Screen name="workstation" />
    </Stack>
  );
}
