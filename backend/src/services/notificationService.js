const { sendPushNotification } = require('../config/firebase');
const User = require('../models/User');

const notify = async (userId, { title, body, data = {} }) => {
  const user = await User.findById(userId).select('fcmToken');
  if (!user?.fcmToken) return;
  await sendPushNotification({ token: user.fcmToken, title, body, data });
};

const NOTIFICATIONS = {
  newBooking: (bookingId) => ({
    title: 'نئی بکنگ درخواست',
    body: 'ایک نئی بکنگ آپ کا انتظار کر رہی ہے',
    data: { type: 'new_booking', bookingId: bookingId.toString() },
  }),
  bookingAccepted: (driverName) => ({
    title: 'بکنگ قبول ہو گئی',
    body: `${driverName} نے آپ کی بکنگ قبول کر لی ہے`,
    data: { type: 'booking_accepted' },
  }),
  bookingCancelled: () => ({
    title: 'بکنگ منسوخ',
    body: 'آپ کی بکنگ منسوخ کر دی گئی ہے',
    data: { type: 'booking_cancelled' },
  }),
  tripStarted: () => ({
    title: 'سفر شروع',
    body: 'آپ کا سفر شروع ہو گیا ہے',
    data: { type: 'trip_started' },
  }),
  tripCompleted: () => ({
    title: 'سفر مکمل',
    body: 'براہ کرم ڈرائیور کو ریٹنگ دیں',
    data: { type: 'trip_completed' },
  }),
  newMessage: (senderName) => ({
    title: `پیغام از ${senderName}`,
    body: 'آپ کے لیے ایک نیا پیغام ہے',
    data: { type: 'new_message' },
  }),
};

module.exports = { notify, NOTIFICATIONS };
