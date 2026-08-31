# Security

## Firebase API keys in this repo

`mobile/firebase.config.js` and `mobile/android/app/google-services.json` contain
Firebase client config keys (`apiKey` / `current_key`). GitHub's secret scanner
flags these — this is expected and does not indicate a leak.

These keys only identify the Firebase project (`rentx-ef9d0`) to the client SDK;
they are not secrets in the way an API secret or private key is, and Google's own
documentation states they are safe to include in client-side code and version
control. This project only uses Firebase for Analytics and FCM push notification
registration — there is no Firestore, Realtime Database, or Storage bucket
exposed by these keys.

The actual safeguard is **API key restrictions** in Google Cloud Console
(APIs & Services → Credentials), not hiding the key:

- Android key: restricted to package `com.rentx.app` + the app's release SHA-1
- Both keys: restricted to only the specific APIs they need (Firebase
  Installations, FCM Registration, Analytics)

If a secret-scanning alert fires on these files, it can be closed as a false
positive (or "revoked" once restrictions above are confirmed in place) rather
than rotated — rotation doesn't remove the old key from git history anyway,
and restriction is what actually prevents misuse.

## What must never be committed

Unlike the Firebase client keys above, the following are real secrets and are
already excluded via `.gitignore` — never commit them:

- `backend/.env` (JWT secret, MongoDB URI, Twilio, Cloudinary, `GOOGLE_CLIENT_ID`)
- `backend/serviceAccountKey.json` (Firebase Admin SDK private key)
- Any OAuth **client secret** (the mobile Google Sign-In flow only needs client
  IDs, never a client secret — if one is ever pasted into chat or code, treat
  it as compromised and regenerate it in Cloud Console)
