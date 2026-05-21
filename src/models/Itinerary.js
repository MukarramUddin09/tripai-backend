/**
 * Itinerary model for day-by-day trip planning with collaborators and sharing.
 */

import mongoose from 'mongoose';
import { ITINERARY_STATUSES, TRIP_TYPES } from '../config/constants.js';

const itineraryItemSchema = new mongoose.Schema(
  {
    time: { type: String, default: '09:00' },
    type: { type: String, required: true },
    name: { type: String, required: true },
    provider: { type: String, default: null },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
    status: { type: String, default: 'planned' },
    notes: { type: String, default: '' },
    cost: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const daySchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    items: { type: [itineraryItemSchema], default: [] },
  },
  { _id: true },
);

const documentSchema = new mongoose.Schema(
  {
    name: String,
    type: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const itinerarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    destination: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    tripType: { type: String, enum: TRIP_TYPES, default: 'leisure' },
    status: { type: String, enum: ITINERARY_STATUSES, default: 'draft' },
    days: { type: [daySchema], default: [] },
    totalBudget: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    sharedLink: { type: String, default: null, index: true },
    isOfflineSaved: { type: Boolean, default: false },
    documents: { type: [documentSchema], default: [] },
    collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true },
);

const Itinerary = mongoose.model('Itinerary', itinerarySchema);
export default Itinerary;
