import https from 'https';
import dotenv from 'dotenv';
dotenv.config();

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

// Dev mock — used when the key is still the placeholder
const IS_DEV_MOCK = !PAYSTACK_SECRET || PAYSTACK_SECRET.startsWith('sk_test_xxx');

const MOCK = {
  initializePayment: (_email, _amount, metadata) => {
    const ref = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const callbackUrl = process.env.PAYSTACK_CALLBACK_URL || 'http://localhost:3000/bookings/verify';
    return Promise.resolve({
      status: true,
      data: {
        reference: ref,
        authorization_url: `${callbackUrl}?reference=${ref}&trxref=${ref}`,
      },
    });
  },
  verifyPayment: (_ref) =>
    Promise.resolve({ status: true, data: { status: 'success', metadata: {} } }),
  refundPayment: (_ref, _amount) =>
    Promise.resolve({ status: true, data: { id: 'dev_refund' } }),
};

// Initialize a payment — returns an authorization URL
export const initializePayment = (email, amount, metadata) => {
  if (IS_DEV_MOCK) return MOCK.initializePayment(email, amount, metadata);
  return new Promise((resolve, reject) => {
    const params = JSON.stringify({
      email,
      amount: amount * 100,
      metadata,
      currency: 'GHS',
      callback_url: process.env.PAYSTACK_CALLBACK_URL,  // ← added
    });

    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: '/transaction/initialize',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json',
      },
    };

    const reqPaystack = https.request(options, (resp) => {
      let data = '';
      resp.on('data', (chunk) => (data += chunk));
      resp.on('end', () => resolve(JSON.parse(data)));
    });

    reqPaystack.on('error', reject);
    reqPaystack.write(params);
    reqPaystack.end();
  });
};

// Verify a payment using the reference
export const verifyPayment = (reference) => {
  if (IS_DEV_MOCK) return MOCK.verifyPayment(reference);
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: `/transaction/verify/${reference}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
      },
    };

    const reqPaystack = https.request(options, (resp) => {
      let data = '';
      resp.on('data', (chunk) => (data += chunk));
      resp.on('end', () => resolve(JSON.parse(data)));
    });

    reqPaystack.on('error', reject);
    reqPaystack.end();
  });
};

// Refund a payment
export const refundPayment = (transaction_id, amount) => {
  if (IS_DEV_MOCK) return MOCK.refundPayment(transaction_id, amount);
  return new Promise((resolve, reject) => {
    const params = JSON.stringify({
      transaction: transaction_id,
      amount: amount * 100,
    });

    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: '/refund',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json',
      },
    };

    const reqPaystack = https.request(options, (resp) => {
      let data = '';
      resp.on('data', (chunk) => (data += chunk));
      resp.on('end', () => resolve(JSON.parse(data)));
    });

    reqPaystack.on('error', reject);
    reqPaystack.write(params);
    reqPaystack.end();
  });
};