const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { sendMessage, getMessages } = require('../controllers/chatController');

router.post('/:bookingId/messages', protect, sendMessage);
router.get('/:bookingId/messages', protect, getMessages);

module.exports = router;
