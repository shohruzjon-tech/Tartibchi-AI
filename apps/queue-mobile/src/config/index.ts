export const Config = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.99:5000/api",
  WS_URL: process.env.EXPO_PUBLIC_WS_URL || "ws://192.168.1.99:5006",
} as const;
