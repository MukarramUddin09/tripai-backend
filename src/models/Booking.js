/**
 * Booking model for all travel reservations (transport, hotel, entertainment).
 * Stores provider references, payment status, and flexible metadata.
 */

import mongoose from 'mongoose';
import { BOOKING_TYPES, BOOKING_STATUSES, PAYMENT_STATUSES } from '../config/constants.js';

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      default: null,
    },
    type: {
      type: String,
      enum: BOOKING_TYPES,
      required: true,
    },
    provider: { type: String, required: true, trim: true },
    providerBookingId: { type: String, default: null },
    from: { type: String, default: null },
    to: { type: String, default: null },
    departureTime: { type: Date, default: null },
    arrivalTime: { type: Date, default: null },
    checkIn: { type: Date, default: null },
    checkOut: { type: Date, default: null },
    passengers: { type: Number, min: 1, default: 1 },
    guests: { type: Number, min: 1, default: 1 },
    class: { type: String, default: null },
    roomType: { type: String, default: null },
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', default: null },
    entertainmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Entertainment',
      default: null,
    },
    status: {
      type: String,
      enum: BOOKING_STATUSES,
      default: 'pending',
    },
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'pending',
    },
    seatNumbers: { type: [String], default: [] },
    ticketTier: { type: String, default: null },
    ticketCount: { type: Number, default: 1 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    refundAmount: { type: Number, default: 0 },
    refundPolicy: { type: String, default: null },
  },
  { timestamps: true },
);

bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ type: 1, status: 1 });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
