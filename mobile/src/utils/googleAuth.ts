import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

// Set after creating OAuth client IDs in Google Cloud Console.
export const GOOGLE_WEB_CLIENT_ID = '145461526346-i5dbelnni6sml36babqhoorn31bf86cp.apps.googleusercontent.com';
export const GOOGLE_ANDROID_CLIENT_ID = '145461526346-ma5h3bi9k44vtiaada0ousklcb42ihch.apps.googleusercontent.com';
export const GOOGLE_IOS_CLIENT_ID = '145461526346-a5rp9i9rio4elnj4chiv7ljkjo5b2cmg.apps.googleusercontent.com';

export const isGoogleAuthConfigured = !!GOOGLE_WEB_CLIENT_ID;

// expo-auth-session's Google provider picks the right client ID and builds
// the correct native redirect URI per platform on its own (Android uses
// androidClientId + the app's package name/SHA-1 registered on that client
// in Google Cloud Console — not a redirect-URI-list like Web clients use).
// Don't override redirectUri here; that fights this platform-aware logic.
export function useGoogleAuthRequest() {
  return Google.useIdTokenAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,
    iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
  });
}
