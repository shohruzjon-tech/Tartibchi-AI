import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="select-workspace" />
      <Stack.Screen name="select-role" />
      <Stack.Screen name="staff-login" />
    </Stack>
  );
}
