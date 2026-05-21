/**
 * Hotel controller — search, availability, booking, and cancellation for stays.
 */

import Booking from '../models/Booking.js';
import Hotel from '../models/Hotel.js';
import { confirmWithProvider } from '../services/providerAdapter.service.js';
import { AppError } from '../middlewares/errorHandler.middleware.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { DEFAULT_PAGE_SIZE, HOTEL_AVAILABILITY_CACHE_MS } from '../config/constants.js';

/** Simple in-memory availability cache with 5-min TTL */
const availabilityCache = new Map();

/** Simple booking locks to mitigate race conditions (dev only) */
const bookingLocks = new Set();

/**
 * Gets mock room availability with 5-minute cache refresh.
 * @param {string} hotelId - Hotel document ID
 * @returns {number}
 */
function getMockAvailability(hotelId) {
  const cached = availabilityCache.get(hotelId);
  if (cached && Date.now() - cached.timestamp < HOTEL_AVAILABILITY_CACHE_MS) {
    return cached.rooms;
  }
  const rooms = Math.floor(Math.random() * 5) + 1;
  availabilityCache.set(hotelId, { rooms, timestamp: Date.now() });
  return rooms;
}

/**
 * GET /api/hotels/search — Search hotels with filters.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function searchHotels(req, res) {
  const { city, maxPrice, minStars, roomType, mealPreference } = req.query;

  const filter = { isActive: true };
  if (city) filter.city = new RegExp(city, 'i');
  if (maxPrice) filter.pricePerNight = { $lte: Number(maxPrice) };
  if (minStars) filter.starRating = { $gte: Number(minStars) };

  let hotels = await Hotel.find(filter).sort({ rating: -1 }).lean();

  if (roomType) {
    hotels = hotels.filter((h) => h.rooms.some((r) => r.type === roomType));
  }

  if (mealPreference === 'veg') {
    hotels = hotels.filter((h) => h.menu?.veg?.length > 0);
  } else if (mealPreference === 'nonveg') {
    hotels = hotels.filter((h) => h.menu?.nonVeg?.length > 0);
  }

  const enriched = hotels.map((h) => ({
    ...h,
    availability: getMockAvailability(h._id.toString()),
  }));

  sendSuccess(res, {
    message: `Found ${enriched.length} hotels`,
    data: enriched,
  });
}

/**
 * GET /api/hotels/:id — Full hotel detail.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function getHotelById(req, res) {
  const hotel = await Hotel.findById(req.params.id);
  if (!hotel) throw new AppError('Hotel not found', 404);
  sendSuccess(res, { data: hotel });
}

/**
 * GET /api/hotels/:id/availability — Room availability for date range.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function getHotelAvailability(req, res) {
  const hotel = await Hotel.findById(req.params.id);
  if (!hotel) throw new AppError('Hotel not found', 404);

  const { checkIn, checkOut, roomType } = req.query;
  const overlapping = await Booking.countDocuments({
    hotelId: hotel._id,
    type: 'hotel',
    status: { $in: ['pending', 'confirmed'] },
    checkIn: { $lte: new Date(checkOut) },
    checkOut: { $gte: new Date(checkIn) },
    roomType: roomType || { $exists: true },
  });

  const room = hotel.rooms.find((r) => !roomType || r.type === roomType);
  const baseAvailability = room?.availability ?? 5;
  const available = Math.max(0, baseAvailability - overlapping);

  sendSuccess(res, {
    data: {
      hotelId: hotel._id,
      roomType: room?.type,
      available,
      checkIn,
      checkOut,
    },
  });
}

/**
 * POST /api/hotels/book — Book a hotel room.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function bookHotel(req, res) {
  const { hotelId, roomType, checkIn, checkOut, guests, mealPreference } = req.body;
  const lockKey = `${hotelId}-${roomType}-${checkIn}`;

  // Simple lock — in production use Redis distributed lock + optimistic locking (version field)
  if (bookingLocks.has(lockKey)) {
    throw new AppError('Booking in progress for this room, please retry', 409);
  }

  bookingLocks.add(lockKey);

  try {
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) throw new AppError('Hotel not found', 404);

    const room = hotel.rooms.find((r) => r.type === roomType);
    if (!room) throw new AppError('Room type not available', 404);

    const nights = Math.ceil(
      (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24),
    );
    const totalAmount = room.price * Math.max(nights, 1);

    const mockAvail = getMockAvailability(hotelId);
    if (mockAvail < 1) {
      throw new AppError('No rooms available', 409);
    }

    const booking = await Booking.create({
      userId: req.user.userId,
      type: 'hotel',
      provider: hotel.provider,
      hotelId: hotel._id,
      roomType,
      checkIn,
      checkOut,
      guests,
      status: 'pending',
      totalAmount,
      metadata: { mealPreference, hotelName: hotel.name },
    });

    const confirmation = await confirmWithProvider({
      provider: hotel.provider,
      hotelId,
      roomType,
    });

    booking.status = confirmation.success ? 'confirmed' : 'failed';
    booking.providerBookingId = confirmation.providerBookingId;
    await booking.save();

    sendSuccess(res, {
      statusCode: 201,
      message: 'Hotel booking confirmed',
      data: {
        booking,
        confirmation: {
          ...confirmation,
          reference: confirmation.providerBookingId,
          provider: 'Booking.com',
        },
      },
    });
  } finally {
    bookingLocks.delete(lockKey);
  }
}

/**
 * GET /api/hotels/bookings — User's hotel bookings (paginated).
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function getHotelBookings(req, res) {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = DEFAULT_PAGE_SIZE;
  const skip = (page - 1) * limit;

  const filter = { userId: req.user.userId, type: 'hotel' };
  const [bookings, total] = await Promise.all([
    Booking.find(filter).populate('hotelId', 'name city').skip(skip).limit(limit),
    Booking.countDocuments(filter),
  ]);

  sendSuccess(res, {
    data: { bookings, pagination: { page, limit, total } },
  });
}

/**
 * PUT /api/hotels/bookings/:id/cancel — Cancel hotel booking with refund policy.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function cancelHotelBooking(req, res) {
  const booking = await Booking.findOne({
    _id: req.params.id,
    userId: req.user.userId,
    type: 'hotel',
  });

  if (!booking) throw new AppError('Booking not found', 404);

  const hoursUntilCheckIn =
    (new Date(booking.checkIn) - Date.now()) / (1000 * 60 * 60);
  const refundPercent = hoursUntilCheckIn > 48 ? 1 : 0.5;
  const refundAmount = Math.round(booking.totalAmount * refundPercent);

  booking.status = 'cancelled';
  booking.refundAmount = refundAmount;
  booking.refundPolicy = hoursUntilCheckIn > 48 ? 'full_refund' : 'partial_50_percent';
  booking.paymentStatus = 'refunded';
  await booking.save();

  sendSuccess(res, {
    message: `Cancelled — ${refundPercent * 100}% refund (₹${refundAmount})`,
    data: { booking, refundAmount, refundPolicy: booking.refundPolicy },
  });
}
