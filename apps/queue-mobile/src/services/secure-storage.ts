import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SECURE_KEYS = {
  ACCESS_TOKEN: "qp_access_token",
  REFRESH_TOKEN: "qp_refresh_token",
  STAFF_ACCESS_TOKEN: "qp_staff_access_token",
  STAFF_REFRESH_TOKEN: "qp_staff_refresh_token",
};

// For web compatibility, fallback to AsyncStorage
const isNative = Platform.OS !== "web";

export const SecureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    if (isNative) {
      await SecureStore.setItemAsync(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  },

  async getItem(key: string): Promise<string | null> {
    if (isNative) {
      return SecureStore.getItemAsync(key);
    }
    return AsyncStorage.getItem(key);
  },

  async removeItem(key: string): Promise<void> {
    if (isNative) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  },

  // Token helpers
  async setTokens(access: string, refresh: string): Promise<void> {
    await Promise.all([
      SecureStorage.setItem(SECURE_KEYS.ACCESS_TOKEN, access),
      SecureStorage.setItem(SECURE_KEYS.REFRESH_TOKEN, refresh),
    ]);
  },

  async getTokens(): Promise<{
    accessToken: string | null;
    refreshToken: string | null;
  }> {
    const [accessToken, refreshToken] = await Promise.all([
      SecureStorage.getItem(SECURE_KEYS.ACCESS_TOKEN),
      SecureStorage.getItem(SECURE_KEYS.REFRESH_TOKEN),
    ]);
    return { accessToken, refreshToken };
  },

  async clearTokens(): Promise<void> {
    await Promise.all([
      SecureStorage.removeItem(SECURE_KEYS.ACCESS_TOKEN),
      SecureStorage.removeItem(SECURE_KEYS.REFRESH_TOKEN),
    ]);
  },

  async setStaffTokens(access: string, refresh: string): Promise<void> {
    await Promise.all([
      SecureStorage.setItem(SECURE_KEYS.STAFF_ACCESS_TOKEN, access),
      SecureStorage.setItem(SECURE_KEYS.STAFF_REFRESH_TOKEN, refresh),
    ]);
  },

  async getStaffTokens(): Promise<{
    accessToken: string | null;
    refreshToken: string | null;
  }> {
    const [accessToken, refreshToken] = await Promise.all([
      SecureStorage.getItem(SECURE_KEYS.STAFF_ACCESS_TOKEN),
      SecureStorage.getItem(SECURE_KEYS.STAFF_REFRESH_TOKEN),
    ]);
    return { accessToken, refreshToken };
  },

  async clearStaffTokens(): Promise<void> {
    await Promise.all([
      SecureStorage.removeItem(SECURE_KEYS.STAFF_ACCESS_TOKEN),
      SecureStorage.removeItem(SECURE_KEYS.STAFF_REFRESH_TOKEN),
    ]);
  },

  async clearAll(): Promise<void> {
    await Promise.all(
      Object.values(SECURE_KEYS).map((key) => SecureStorage.removeItem(key)),
    );
  },
};

export { SECURE_KEYS };
