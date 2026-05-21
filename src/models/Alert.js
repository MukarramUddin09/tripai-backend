/**
 * Alert model for city-based safety, weather, traffic, and health notifications.
 */

import mongoose from 'mongoose';
import { ALERT_TYPES, ALERT_SEVERITIES } from '../config/constants.js';

const alertSchema = new mongoose.Schema(
  {
    city: { type: String, required: true, trim: true, index: true },
    type: { type: String, enum: ALERT_TYPES, required: true },
    severity: { type: String, enum: ALERT_SEVERITIES, default: 'low' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    source: { type: String, default: 'TripAI Monitor' },
    expiresAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

alertSchema.index({ city: 1, isActive: 1, expiresAt: 1 });

const Alert = mongoose.model('Alert', alertSchema);
export default Alert;
