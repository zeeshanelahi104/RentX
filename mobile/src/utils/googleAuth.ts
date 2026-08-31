import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

// Set after creating OAuth client IDs in Google Cloud Console.
// A Web client ID is enough to test on web/Expo Go; add Android/iOS ones
// for standalone builds later.
export const GOOGLE_WEB_CLIENT_ID = '';
export const GOOGLE_ANDROID_CLIENT_ID = '';
export const GOOGLE_IOS_CLIENT_ID = '';

export const isGoogleAuthConfigured = !!GOOGLE_WEB_CLIENT_ID;

export function useGoogleAuthRequest() {
  return Google.useIdTokenAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,
    iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
  });
}
