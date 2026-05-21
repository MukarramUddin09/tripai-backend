/**
 * Feedback model for user ratings and reviews of travel providers.
 */

import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
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
      default: null,
    },
    provider: { type: String, required: true, trim: true },
    providerType: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 2000, default: '' },
    tags: { type: [String], default: [] },
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true },
);

feedbackSchema.index({ provider: 1, createdAt: -1 });

const Feedback = mongoose.model('Feedback', feedbackSchema);
export default Feedback;
