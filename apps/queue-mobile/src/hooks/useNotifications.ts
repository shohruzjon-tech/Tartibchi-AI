import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useAppSelector, useAppDispatch } from "@/src/store";
import {
  registerForPushNotifications,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  scheduleLocalNotification,
} from "@/src/services/notifications";

/**
 * Hook to initialize push notifications, listen for incoming notifications,
 * and handle notification taps. Must be called in root layout.
 */
export function useNotifications() {
  const dispatch = useAppDispatch();
  const settings = useAppSelector((s) => s.settings.notifications);
  const notificationListener = useRef<Notifications.EventSubscription | null>(
    null,
  );
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (settings.pushEnabled) {
      registerForPushNotifications().then((token) => {
        if (token) {
          console.log("Push token:", token);
          // Could send this token to the backend for server push
        }
      });
    }

    // Listen for incoming notifications while app is in foreground
    notificationListener.current = addNotificationReceivedListener(
      (notification) => {
        const data = notification.request.content.data;
        // Can dispatch to Redux here if needed
        console.log("Notification received:", data);
      },
    );

    // Listen for user tapping on a notification
    responseListener.current = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.type === "ticket_called") {
        router.push("/(staff)/workstation");
      } else if (data?.type === "appointment_reminder") {
        router.push("/(admin)/management");
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [settings.pushEnabled]);
}

/**
 * Trigger a local notification based on a WebSocket event.
 * Respects user notification preferences.
 */
export function useSocketNotifications() {
  const settings = useAppSelector((s) => s.settings.notifications);

  const notifyTicketCalled = (ticketNumber: string) => {
    if (!settings.pushEnabled || !settings.ticketCalled) return;
    scheduleLocalNotification({
      title: "🎫 Your ticket is called!",
      body: `Ticket ${ticketNumber} — please proceed to the counter`,
      data: { type: "ticket_called" },
      channelId: "queue-updates",
    });
  };

  const notifyTicketAlmostReady = (position: number) => {
    if (!settings.pushEnabled || !settings.ticketAlmostReady) return;
    scheduleLocalNotification({
      title: "⏳ Almost your turn!",
      body: `You are ${position} position(s) away`,
      data: { type: "ticket_almost_ready" },
      channelId: "queue-updates",
    });
  };

  const notifyAppointmentReminder = (name: string, time: string) => {
    if (!settings.pushEnabled || !settings.appointmentReminder) return;
    scheduleLocalNotification({
      title: "📅 Appointment Reminder",
      body: `${name} at ${time}`,
      data: { type: "appointment_reminder" },
      channelId: "appointments",
    });
  };

  const notifyQueueUpdate = (message: string) => {
    if (!settings.pushEnabled || !settings.queueUpdates) return;
    scheduleLocalNotification({
      title: "📊 Queue Update",
      body: message,
      data: { type: "queue_update" },
      channelId: "queue-updates",
    });
  };

  const notifySystem = (title: string, message: string) => {
    if (!settings.pushEnabled || !settings.systemAlerts) return;
    scheduleLocalNotification({
      title: `🔔 ${title}`,
      body: message,
      data: { type: "system_alert" },
    });
  };

  return {
    notifyTicketCalled,
    notifyTicketAlmostReady,
    notifyAppointmentReminder,
    notifyQueueUpdate,
    notifySystem,
  };
}
