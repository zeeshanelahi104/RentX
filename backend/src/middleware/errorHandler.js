// Field-specific messages for duplicate-key conflicts, shown to the user in Urdu.
const DUPLICATE_FIELD_MESSAGES = {
  cnicNumber: 'یہ CNIC نمبر پہلے سے ایک اور اکاؤنٹ میں رجسٹرڈ ہے',
  plateNumber: 'یہ نمبر پلیٹ پہلے سے رجسٹرڈ ہے',
  phone: 'یہ فون نمبر پہلے سے رجسٹرڈ ہے',
  email: 'یہ ای میل پہلے سے رجسٹرڈ ہے',
  userId: 'ڈرائیور پروفائل پہلے سے موجود ہے',
};

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let field;

  // Mongoose duplicate key
  if (err.code === 11000) {
    field = Object.keys(err.keyValue)[0];
    message = DUPLICATE_FIELD_MESSAGES[field] || `${field} already exists`;
    statusCode = 400;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    field = Object.keys(err.errors)[0];
    message = Object.values(err.errors).map(e => e.message).join(', ');
    statusCode = 400;
  }

  // Multer upload errors (file size, unexpected field) and custom fileFilter rejections
  if (err.name === 'MulterError' || /only image files/i.test(err.message || '')) {
    statusCode = 400;
    message = err.code === 'LIMIT_FILE_SIZE'
      ? 'فائل کا سائز 5MB سے کم ہونا چاہیے'
      : 'براہ کرم درست تصویر منتخب کریں';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid token';
    statusCode = 401;
  }

  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  }

  res.status(statusCode).json({ success: false, message, field });
};

module.exports = errorHandler;
