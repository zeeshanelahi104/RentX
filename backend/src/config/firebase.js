const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let firebaseInitialized = false;

const initFirebase = () => {
  if (firebaseInitialized) return;

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (!serviceAccountPath || !fs.existsSync(path.resolve(serviceAccountPath))) {
    console.warn('Firebase service account not found — push notifications disabled');
    return;
  }

  admin.initializeApp({
    credential: admin.credential.cert(path.resolve(serviceAccountPath)),
  });

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
