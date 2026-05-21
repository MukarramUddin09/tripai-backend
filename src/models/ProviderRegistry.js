/**
 * ProviderRegistry model tracking provider quality scores and health status.
 * Updated by feedbackScoring service using exponential moving average.
 */

import mongoose from 'mongoose';
import { PROVIDER_STATUSES } from '../config/constants.js';

const providerRegistrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    type: { type: String, required: true },
    score: { type: Number, min: 0, max: 5, default: 4 },
    status: { type: String, enum: PROVIDER_STATUSES, default: 'active' },
    totalRatings: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const ProviderRegistry = mongoose.model('ProviderRegistry', providerRegistrySchema);
export default ProviderRegistry;
