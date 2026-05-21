/**
 * Hotel model for accommodation search, booking, and menu offerings.
 * Includes GeoJSON location for proximity queries.
 */

import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema(
  { name: String, price: Number },
  { _id: false },
);

const roomSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    beds: { type: Number, default: 1 },
    capacity: { type: Number, default: 2 },
    price: { type: Number, required: true },
    availability: { type: Number, default: 5 },
  },
  { _id: false },
);

const hotelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true, index: true },
    address: { type: String, required: true },
    starRating: { type: Number, min: 1, max: 5, default: 3 },
    pricePerNight: { type: Number, required: true, min: 0 },
    amenities: { type: [String], default: [] },
    images: { type: [String], default: [] },
    rooms: { type: [roomSchema], default: [] },
    menu: {
      veg: { type: [menuItemSchema], default: [] },
      nonVeg: { type: [menuItemSchema], default: [] },
    },
    provider: {
      type: String,
      enum: ['Booking.com', 'OYO', 'direct'],
      default: 'direct',
    },
    providerId: { type: String, default: null },
    rating: { type: Number, min: 0, max: 5, default: 4 },
    totalReviews: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
  },
  { timestamps: true },
);

hotelSchema.index({ location: '2dsphere' });
hotelSchema.index({ city: 1, starRating: -1 });

const Hotel = mongoose.model('Hotel', hotelSchema);
export default Hotel;
