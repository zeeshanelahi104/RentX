import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { updateFCMToken } from '../services/authService';
import { navigate } from '../navigation/navigationRef';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Requests permission, fetches this device's FCM token, and syncs it to the
// backend's User.fcmToken (consumed by notificationService.notify on the server).
export async function registerForPushNotifications() {
  if (!Device.isDevice) return;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return;

    const { data: fcmToken } = await Notifications.getDevicePushTokenAsync();
    await updateFCMToken(fcmToken);
  } catch (err) {
    // Remote push isn't supported in Expo Go on Android (SDK 53+) — expected
    // there, and only actionable with a custom development build.
    console.warn('Push notifications unavailable:', err);
  }
}

// Routes a tapped notification to the relevant screen, based on the `data.type`
// payloads sent by backend/src/services/notificationService.js.
function handleNotificationTap(data: Record<string, any>) {
  switch (data?.type) {
    case 'new_booking':
    case 'booking_accepted':
    case 'booking_cancelled':
    case 'trip_started':
    case 'trip_completed':
    case 'new_message':
      if (data.bookingId) navigate('Chat', { bookingId: data.bookingId });
      break;
  }
}

// Attaches listeners for notifications received while the app is foregrounded
// and for taps on a notification (foreground, background, or cold start).
// Call once near the navigation root; returns a cleanup function.
export function attachNotificationListeners() {
  const receivedSub = Notifications.addNotificationReceivedListener(() => {});

  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    handleNotificationTap(response.notification.request.content.data as Record<string, any>);
  });

  Notifications.getLastNotificationResponseAsync().then((response) => {
    if (response) handleNotificationTap(response.notification.request.content.data as Record<string, any>);
  });

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}
