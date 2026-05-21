/**
 * Travel booking controller — search, book, and manage transport reservations.
 */

import Booking from '../models/Booking.js';
import * as fareComparison from '../services/fareComparison.service.js';
import { confirmWithProvider, refundWithProvider } from '../services/providerAdapter.service.js';
import { AppError } from '../middlewares/errorHandler.middleware.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { DEFAULT_PAGE_SIZE } from '../config/constants.js';

/**
 * POST /api/travel/search — Search transport options across providers.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function searchTravel(req, res) {
  const { type, from, to, date, passengers, class: travelClass, preference } = req.body;

  const { results, bestOption, aiRecommended } = await fareComparison.searchAndRank(
    type,
    { from, to, date, passengers, class: travelClass },
    preference || 'price',
  );

  sendSuccess(res, {
    message: `Found ${results.length} ${type} options`,
    data: { results, recommended: bestOption, aiRecommended },
  });
}

/**
 * POST /api/travel/book — Create booking and confirm with mock provider.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function bookTravel(req, res) {
  const {
    resultId,
    provider,
    type,
    from,
    to,
    departureTime,
    arrivalTime,
    passengers,
    class: travelClass,
    totalAmount,
    tripId,
    metadata,
  } = req.body;

  const booking = await Booking.create({
    userId: req.user.userId,
    tripId: tripId || null,
    type,
    provider,
    from,
    to,
    departureTime,
    arrivalTime,
    passengers: passengers || 1,
    class: travelClass,
    status: 'pending',
    totalAmount,
    metadata: { ...metadata, resultId },
  });

  const confirmation = await confirmWithProvider({ provider, type, resultId });

  booking.status = confirmation.success ? 'confirmed' : 'failed';
  booking.providerBookingId = confirmation.providerBookingId;
  booking.paymentStatus = confirmation.success ? 'pending' : 'failed';
  await booking.save();

  sendSuccess(res, {
    statusCode: confirmation.success ? 201 : 422,
    message: confirmation.message,
    data: { booking, confirmation },
  });
}

/**
 * GET /api/travel/bookings — Paginated list of user's transport bookings.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function getBookings(req, res) {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = DEFAULT_PAGE_SIZE;
  const skip = (page - 1) * limit;

  const filter = {
    userId: req.user.userId,
    type: { $in: ['flight', 'train', 'bus', 'cab', 'bike', 'localRide'] },
  };

  const [bookings, total] = await Promise.all([
    Booking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Booking.countDocuments(filter),
  ]);

  sendSuccess(res, {
    data: { bookings, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
  });
}

/**
 * GET /api/travel/bookings/:id — Single booking detail.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function getBookingById(req, res) {
  const booking = await Booking.findOne({
    _id: req.params.id,
    userId: req.user.userId,
  });

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  sendSuccess(res, { data: booking });
}

/**
 * DELETE /api/travel/bookings/:id/cancel — Cancel booking and initiate refund.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function cancelBooking(req, res) {
  const booking = await Booking.findOne({
    _id: req.params.id,
    userId: req.user.userId,
  });

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  if (booking.status === 'cancelled') {
    throw new AppError('Booking already cancelled', 400);
  }

  booking.status = 'cancelled';
  const refund = booking.providerBookingId
    ? await refundWithProvider(booking.providerBookingId, booking.totalAmount)
    : { status: 'not_applicable', amount: 0 };

  booking.refundAmount = refund.amount || booking.totalAmount;
  booking.paymentStatus = 'refunded';
  await booking.save();

  sendSuccess(res, {
    message: 'Booking cancelled',
    data: { booking, refund },
  });
}

/**
 * POST /api/travel/local-rides/search — Search local ride options with AI recommendation.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function searchLocalRides(req, res) {
  const { from, to, preference } = req.body;

  const { results, bestOption, aiRecommended } = await fareComparison.searchAndRank(
    'localRide',
    { from, to },
    preference || 'price',
  );

  sendSuccess(res, {
    message: 'Local ride options retrieved',
    data: {
      results,
      recommended: bestOption,
      aiRecommended: aiRecommended || bestOption,
    },
  });
}
