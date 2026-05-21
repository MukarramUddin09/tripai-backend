/**
 * Trip model representing a user's planned or active journey.
 * Links to bookings and itineraries for agent orchestration.
 */

import mongoose from 'mongoose';
import { TRIP_TYPES } from '../config/constants.js';

const tripSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    from: { type: String, required: true, trim: true },
    to: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    tripType: { type: String, enum: TRIP_TYPES, default: 'leisure' },
    passengers: { type: Number, min: 1, default: 1 },
    preferences: {
      transport: { type: [String], default: [] },
      budget: { type: Number, default: 0 },
      meal: { type: String, default: 'veg' },
    },
    status: {
      type: String,
      enum: ['planning', 'booked', 'in_progress', 'completed', 'cancelled'],
      default: 'planning',
    },
    bookingIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }],
    estimatedCost: { type: Number, default: 0 },
    notes: { type: String, default: '' },
  },
  { timestamps: true },
);

tripSchema.index({ userId: 1, startDate: -1 });

const Trip = mongoose.model('Trip', tripSchema);
export default Trip;
