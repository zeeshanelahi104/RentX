import { Alert, Platform } from 'react-native';

type AlertButton = {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

// react-native-web's Alert.alert() is a no-op, so errors and confirmations
// silently vanish on web. Fall back to window.alert/confirm there.
export function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  const text = [title, message].filter(Boolean).join('\n');

  if (!buttons || buttons.length <= 1) {
    window.alert(text);
    buttons?.[0]?.onPress?.();
    return;
  }

  // Call sites in this app list the dismiss/cancel option first and the
  // confirm/destructive action last (see ProfileScreen logout, booking reject).
  const cancelBtn = buttons[0];
  const confirmBtn = buttons[buttons.length - 1];

  if (window.confirm(text)) {
    confirmBtn?.onPress?.();
  } else {
    cancelBtn?.onPress?.();
  }
}
