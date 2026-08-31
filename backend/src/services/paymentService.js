const axios = require('axios');

// PayPro.pk Integration
// Sign up at: https://merchant.paypro.com.pk/
// Docs: https://developer.paypro.com.pk/

const PAYPRO_BASE_URL = 'https://merchant.paypro.com.pk/v2';
const PAYPRO_USERNAME = process.env.PAYPRO_USERNAME;
const PAYPRO_PASSWORD = process.env.PAYPRO_PASSWORD;

// EasyPaisa Integration
// Apply at: https://sandbox.easypaisa.com.pk/
const EASYPAISA_STORE_ID = process.env.EASYPAISA_STORE_ID;
const EASYPAISA_HASH_KEY = process.env.EASYPAISA_HASH_KEY;

// JazzCash Integration
// Apply at: https://sandbox.jazzcash.com.pk/
const JAZZCASH_MERCHANT_ID = process.env.JAZZCASH_MERCHANT_ID;
const JAZZCASH_PASSWORD = process.env.JAZZCASH_PASSWORD;
const JAZZCASH_INTEGRITY_SALT = process.env.JAZZCASH_INTEGRITY_SALT;

/**
 * Create a PayPro.pk payment invoice
 * Returns a checkout URL to redirect customer to
 */
const createPayProInvoice = async ({ orderId, amount, customerName, customerEmail, customerPhone, description }) => {
  try {
    // Step 1: Get auth token
    const authRes = await axios.post(`${PAYPRO_BASE_URL}/login`, {
      username: PAYPRO_USERNAME,
      isSubUser: true,
      password: PAYPRO_PASSWORD,
    });
    const token = authRes.data.ClientCredentials?.token;
    const companyId = authRes.data.ClientCredentials?.CompanyId;

    // Step 2: Create order
    const orderRes = await axios.post(
      `${PAYPRO_BASE_URL}/ccpayment`,
      [
        {
          MerchantId: companyId,
          Description: description || 'RentX Booking Payment',
          MerchantOrderId: orderId,
          Language: 'UR',
          Currency: 'PKR',
          MerchantAmount: amount,
          TaxAmount: 0,
          DiscountAmount: 0,
          PriceExcludingTax: amount,
          OrderExpiryDateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          Items: [{ Description: description, UnitPrice: amount, Quantity: 1, Amount: amount }],
          EmailAddress: customerEmail || 'customer@rentx.pk',
          MobileNumber: customerPhone,
          CustomerName: customerName,
        },
      ],
      { headers: { token, companyid: companyId } }
    );

    return {
      success: true,
      checkoutUrl: orderRes.data?.[0]?.Click2Pay,
      orderId,
    };
  } catch (err) {
    console.error('PayPro error:', err.response?.data || err.message);
    return { success: false, error: err.message };
  }
};

/**
 * EasyPaisa OTC (Over-the-Counter) payment
 * Generates a transaction token customer takes to an EasyPaisa agent
 */
const createEasypaisaOTC = async ({ orderId, amount, customerPhone }) => {
  const crypto = require('crypto');
  const datetime = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().replace(/[-:T]/g, '').slice(0, 14);

  const hashString = `${EASYPAISA_HASH_KEY}&amount=${amount * 100}&expiryDate=${expiryDate}&merchantPaymentRef=${orderId}&msisdn=${customerPhone}&orderId=${orderId}&password=${EASYPAISA_HASH_KEY}&storeId=${EASYPAISA_STORE_ID}&timetamp=${datetime}&transactionType=OTC`;
  const hash = crypto.createHash('sha256').update(hashString).digest('hex').toUpperCase();

  const payload = {
    orderId,
    storeId: EASYPAISA_STORE_ID,
    transactionType: 'OTC',
    tokenExpiry: expiryDate,
    amount: amount * 100,
    msisdn: customerPhone,
    timestamp: datetime,
    postBackURL: `${process.env.BACKEND_URL}/api/payments/easypaisa-callback`,
    merchantPaymentRef: orderId,
    signature: hash,
    password: EASYPAISA_HASH_KEY,
  };

  // In production, call EasyPaisa sandbox/live API here
  console.log('[DEV] EasyPaisa OTC payload:', payload);
  return { success: true, payload, note: 'Implement with live EasyPaisa API credentials' };
};

/**
 * JazzCash Mobile Account Payment
 */
const createJazzCashPayment = async ({ orderId, amount, customerPhone }) => {
  const crypto = require('crypto');
  const datetime = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const expiry = new Date(Date.now() + 60 * 60 * 1000).toISOString().replace(/[-:T.]/g, '').slice(0, 14);

  const hashStr = `${JAZZCASH_INTEGRITY_SALT}&${amount * 100}&PKR&${JAZZCASH_MERCHANT_ID}&${customerPhone}&${orderId}&${expiry}&${datetime}&MWALLET`;
  const hash = crypto.createHmac('sha256', JAZZCASH_INTEGRITY_SALT).update(hashStr).digest('hex');

  const payload = {
    pp_Version: '1.1',
    pp_TxnType: 'MWALLET',
    pp_Language: 'UR',
    pp_MerchantID: JAZZCASH_MERCHANT_ID,
    pp_Password: JAZZCASH_PASSWORD,
    pp_TxnRefNo: orderId,
    pp_Amount: amount * 100,
    pp_TxnCurrency: 'PKR',
    pp_TxnDateTime: datetime,
    pp_BillReference: `rentx_${orderId}`,
    pp_Description: 'RentX Booking',
    pp_TxnExpiryDateTime: expiry,
    pp_MobileNumber: customerPhone,
    ppmpf_1: 'RentX',
    pp_SecureHash: hash,
  };

  console.log('[DEV] JazzCash payload:', payload);
  return { success: true, payload, note: 'Submit to JazzCash live/sandbox endpoint' };
};

/**
 * Recommended for MVP: Track manual payment status
 */
const recordManualPayment = async (bookingId, method, reference) => {
  const Booking = require('../models/Booking');
  await Booking.findByIdAndUpdate(bookingId, {
    paymentStatus: 'paid',
    paymentReference: reference,
  });
  return { success: true };
};

module.exports = {
  createPayProInvoice,
  createEasypaisaOTC,
  createJazzCashPayment,
  recordManualPayment,
};
