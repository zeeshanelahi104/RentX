const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let firebaseInitialized = false;

const initFirebase = () => {
  if (firebaseInitialized) return;

  // Production (Render, etc.): paste the full service account JSON into this
  // env var, since there's no local file to point at on a hosted server.
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  // Local dev: keep using a file path, as before.
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  let credential;
  if (serviceAccountJson) {
    try {
      credential = admin.credential.cert(JSON.parse(serviceAccountJson));
    } catch (err) {
      console.warn('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON — push notifications disabled');
      return;
    }
  } else if (serviceAccountPath && fs.existsSync(path.resolve(serviceAccountPath))) {
    credential = admin.credential.cert(path.resolve(serviceAccountPath));
  } else {
    console.warn('Firebase service account not found — push notifications disabled');
    return;
  }

  admin.initializeApp({ credential });

  firebaseInitialized = true;
  console.log('Firebase Admin initialized');
};

const sendPushNotification = async ({ token, title, body, data = {} }) => {
  if (!firebaseInitialized) return;
  try {
    await admin.messaging().send({ token, notification: { title, body }, data });
  } catch (err) {
    console.error('FCM error:', err.message);
  }
};

const sendMulticastNotification = async ({ tokens, title, body, data = {} }) => {
  if (!firebaseInitialized || !tokens.length) return;
  try {
    await admin.messaging().sendEachForMulticast({ tokens, notification: { title, body }, data });
  } catch (err) {
    console.error('FCM multicast error:', err.message);
  }
};

module.exports = { initFirebase, sendPushNotification, sendMulticastNotification };
