const Message = require('../models/Message');
const Booking = require('../models/Booking');
const Driver = require('../models/Driver');
const { notify, NOTIFICATIONS } = require('../services/notificationService');
const { getIO } = require('../socket');

// POST /api/chats/:bookingId/messages
const sendMessage = async (req, res, next) => {
  try {
    const { text } = req.body;
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId).populate('driverId');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const isRider = booking.riderId.toString() === req.user._id.toString();
    const driverUserId = booking.driverId.userId.toString();
    const isDriver = driverUserId === req.user._id.toString();

    if (!isRider && !isDriver) return res.status(403).json({ success: false, message: 'Access denied' });

    const receiverId = isRider ? booking.driverId.userId : booking.riderId;

    const message = await Message.create({
      bookingId,
      senderId: req.user._id,
      receiverId,
      text,
    });

    // Emit via socket
    const io = getIO();
    io?.to(`booking_${bookingId}`).emit('new_message', {
      message: { ...message.toObject(), senderName: req.user.name },
    });

    // Push notification
    await notify(receiverId, NOTIFICATIONS.newMessage(req.user.name));

    res.status(201).json({ success: true, message });
  } catch (err) {
    next(err);
  }
};

// GET /api/chats/:bookingId/messages
const getMessages = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId).populate('driverId');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const driverUserId = booking.driverId.userId.toString();
    const isParticipant =
      booking.riderId.toString() === req.user._id.toString() ||
      driverUserId === req.user._id.toString();

    if (!isParticipant) return res.status(403).json({ success: false, message: 'Access denied' });

    const messages = await Message.find({ bookingId })
      .populate('senderId', 'name profilePhoto')
      .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      { bookingId, receiverId: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({ success: true, messages });
  } catch (err) {
    next(err);
  }
};

module.exports = { sendMessage, getMessages };
