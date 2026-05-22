/**
 * Payment controller — Razorpay orders, verify, history, invoices, and direct UPI.
 */

import crypto from 'crypto';
import Razorpay from 'razorpay';
import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import { env } from '../config/env.js';
import logger from '../utils/logger.js';
import { AppError } from '../middlewares/errorHandler.middleware.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { DEFAULT_PAGE_SIZE } from '../config/constants.js';

/**
 * @returns {import('razorpay').default}
 */
function getRazorpayClient() {
  if (!env.razorpayKeyId || !env.razorpayKeySecret) {
    throw new AppError('Payment gateway not configured', 503);
  }
  return new Razorpay({
    key_id: env.razorpayKeyId,
    key_secret: env.razorpayKeySecret,
  });
}

/**
 * POST /api/payments/initiate — Create Razorpay order and pending payment record.
 */
export async function initiatePayment(req, res) {
  const { bookingId, amount, method, currency } = req.body;

  const booking = await Booking.findOne({ _id: bookingId, userId: req.user.userId });
  if (!booking) throw new AppError('Booking not found', 404);

  const razorpay = getRazorpayClient();
  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100),
    currency: currency || 'INR',
    receipt: `receipt_${Date.now()}`,
  });

  const payment = await Payment.create({
    userId: req.user.userId,
    bookingId,
    amount,
    currency: currency || 'INR',
    method,
    status: 'pending',
    providerRef: order.id,
  });

  sendSuccess(res, {
    statusCode: 201,
    message: 'Payment initiated',
    data: {
      payment,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      razorpayKeyId: env.razorpayKeyId,
    },
  });
}

/**
 * POST /api/payments/verify — Verify Razorpay signature and mark payment success.
 */
export async function verifyPayment(req, res) {
  const {
    paymentId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  const payment = await Payment.findOne({ _id: paymentId, userId: req.user.userId });
  if (!payment) throw new AppError('Payment not found', 404);

  if (!env.razorpayKeySecret) {
    throw new AppError('Payment gateway not configured', 503);
  }

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expected = crypto
    .createHmac('sha256', env.razorpayKeySecret)
    .update(body)
    .digest('hex');

  if (expected !== razorpay_signature) {
    throw new AppError('Invalid payment signature', 400);
  }

  payment.status = 'success';
  payment.transactionId = razorpay_payment_id;
  await payment.save();

  const booking = await Booking.findById(payment.bookingId);
  if (booking) {
    booking.paymentStatus = 'paid';
    await booking.save();
  }

  sendSuccess(res, { message: 'Payment verified', data: payment });
}

/**
 * GET /api/payments/history — User payment history with filters.
 */
export async function getPaymentHistory(req, res) {
  const filter = { userId: req.user.userId };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.method) filter.method = req.query.method;

  const page = parseInt(req.query.page, 10) || 1;
  const skip = (page - 1) * DEFAULT_PAGE_SIZE;

  const payments = await Payment.find(filter)
    .populate('bookingId')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(DEFAULT_PAGE_SIZE);

  sendSuccess(res, { data: payments });
}

/**
 * POST /api/payments/generate-invoice — Build GST invoice JSON for PDF rendering.
 */
export async function generateInvoice(req, res) {
  const { paymentId, gstin, buyerName } = req.body;

  const payment = await Payment.findOne({ _id: paymentId, userId: req.user.userId });
  if (!payment) throw new AppError('Payment not found', 404);

  const taxableAmount = payment.amount / 1.18;
  const cgst = taxableAmount * 0.09;
  const sgst = taxableAmount * 0.09;

  const invoiceData = {
    invoiceNumber: `INV-${Date.now()}`,
    date: new Date().toISOString(),
    seller: { name: 'TripAI Pvt Ltd', gstin: '29AABCT1234F1Z5' },
    buyer: { name: buyerName, gstin },
    items: [{ description: 'Travel booking', amount: payment.amount }],
    gstDetails: { cgst, sgst, igst: 0, taxableAmount, total: payment.amount },
    currency: payment.currency,
  };

  payment.gstDetails = invoiceData.gstDetails;
  payment.invoiceData = invoiceData;
  await payment.save();

  sendSuccess(res, { message: 'Invoice generated', data: invoiceData });
}

/**
 * POST /api/payments/direct-upi — Record direct UPI payment (logged only).
 */
export async function directUpiPayment(req, res) {
  const { bookingId, amount, upiId, note } = req.body;

  logger.info('[Direct UPI] Payment recorded', {
    userId: req.user.userId,
    bookingId,
    amount,
    upiId,
    note,
  });

  const payment = await Payment.create({
    userId: req.user.userId,
    bookingId,
    amount,
    method: 'upi',
    status: 'success',
    isDirectPayment: true,
    transactionId: `UPI-${Date.now()}`,
    providerRef: upiId,
  });

  sendSuccess(res, {
    statusCode: 201,
    message: 'Direct UPI payment recorded',
    data: payment,
  });
}
