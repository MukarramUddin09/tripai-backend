/**
 * Entertainment model for tourist attractions, movies, and shows.
 */

import mongoose from 'mongoose';
import { ENTERTAINMENT_TYPES } from '../config/constants.js';

const ticketTierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    capacity: { type: Number, default: 100 },
    available: { type: Number, default: 100 },
  },
  { _id: false },
);

const entertainmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true, index: true },
    type: { type: String, enum: ENTERTAINMENT_TYPES, required: true },
    description: { type: String, default: '' },
    location: { type: String, required: true },
    openingHours: { type: String, default: '09:00 - 21:00' },
    entryFee: { type: Number, default: 0 },
    popularity: { type: Number, min: 0, max: 100, default: 50 },
    images: { type: [String], default: [] },
    ticketTiers: { type: [ticketTierSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

entertainmentSchema.index({ city: 1, popularity: -1 });

const Entertainment = mongoose.model('Entertainment', entertainmentSchema);
export default Entertainment;
