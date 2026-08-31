const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  // Auth middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    console.log(`Socket connected: ${userId}`);

    // Join personal room to receive targeted events
    socket.join(`user_${userId}`);

    // Join a booking's chat room
    socket.on('join_booking', (bookingId) => {
      socket.join(`booking_${bookingId}`);
    });

    socket.on('leave_booking', (bookingId) => {
      socket.leave(`booking_${bookingId}`);
    });

    // Driver location updates
    socket.on('driver_location', ({ lat, lng, bookingId }) => {
      if (bookingId) {
        socket.to(`booking_${bookingId}`).emit('driver_location_update', { lat, lng });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${userId}`);
    });
  });

  return io;
};

const getIO = () => io;

module.exports = { initSocket, getIO };
