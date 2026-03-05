import React, { useEffect, useCallback } from "react";
import { StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import * as Haptics from "expo-haptics";
import "react-native-reanimated";
import { store, persistor } from "@/src/store";
import { AlertContainer } from "@/src/components/ui";
import { useNotifications } from "@/src/hooks/useNotifications";
import "@/src/i18n";

SplashScreen.preventAutoHideAsync();

function NotificationInitializer() {
  useNotifications();
  return null;
}

export default function RootLayout() {
  const onReady = useCallback(async () => {
    await SplashScreen.hideAsync();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  useEffect(() => {
    const timer = setTimeout(onReady, 1200);
    return () => clearTimeout(timer);
  }, [onReady]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <NotificationInitializer />
          <StatusBar style="auto" />
          <AlertContainer />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "slide_from_right",
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" options={{ animation: "fade" }} />
            <Stack.Screen
              name="(onboarding)"
              options={{ animation: "slide_from_bottom" }}
            />
            <Stack.Screen name="(admin)" />
            <Stack.Screen name="(manager)" />
            <Stack.Screen name="(staff)" />
          </Stack>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
