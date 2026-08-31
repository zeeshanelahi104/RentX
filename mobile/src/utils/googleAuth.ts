import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

// Set after creating OAuth client IDs in Google Cloud Console.
// A Web client ID is enough to test on web/Expo Go; add Android/iOS ones
// for standalone builds later.
export const GOOGLE_WEB_CLIENT_ID = '145461526346-i5dbelnni6sml36babqhoorn31bf86cp.apps.googleusercontent.com';
export const GOOGLE_ANDROID_CLIENT_ID = '145461526346-ma5h3bi9k44vtiaada0ousklcb42ihch.apps.googleusercontent.com';
export const GOOGLE_IOS_CLIENT_ID = '145461526346-a5rp9i9rio4elnj4chiv7ljkjo5b2cmg.apps.googleusercontent.com';

export const isGoogleAuthConfigured = !!GOOGLE_WEB_CLIENT_ID;

export function useGoogleAuthRequest() {
  return Google.useIdTokenAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,
    iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
  });
}
