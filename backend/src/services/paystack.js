import https from 'https';
import dotenv from 'dotenv';
dotenv.config();

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

// Initialize a payment — returns an authorization URL
export const initializePayment = (email, amount, metadata) => {
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