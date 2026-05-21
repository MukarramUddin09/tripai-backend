/**
 * Payment model for transaction records, GST details, and receipts.
 */

import mongoose from 'mongoose';
import { PAYMENT_METHODS, PAYMENT_RECORD_STATUSES } from '../config/constants.js';

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    method: { type: String, enum: PAYMENT_METHODS, required: true },
    status: {
      type: String,
      enum: PAYMENT_RECORD_STATUSES,
      default: 'pending',
    },
    transactionId: { type: String, default: null },
    providerRef: { type: String, default: null },
    isDirectPayment: { type: Boolean, default: false },
    gstDetails: {
      gstin: String,
      cgst: Number,
      sgst: Number,
      igst: Number,
      taxableAmount: Number,
    },
    receipt: { type: String, default: null },
    invoiceData: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
);

paymentSchema.index({ userId: 1, createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
