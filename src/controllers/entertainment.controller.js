/**
 * Entertainment controller — search, availability, and ticket booking.
 */

import Booking from '../models/Booking.js';
import Entertainment from '../models/Entertainment.js';
import { AppError } from '../middlewares/errorHandler.middleware.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * GET /api/entertainment/search — Search by city and type.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function searchEntertainment(req, res) {
  const filter = { isActive: true };
  if (req.query.city) filter.city = new RegExp(req.query.city, 'i');
  if (req.query.type) filter.type = req.query.type;

  const results = await Entertainment.find(filter).sort({ popularity: -1 }).lean();
  sendSuccess(res, { data: results, message: `Found ${results.length} venues` });
}

/**
 * GET /api/entertainment/:id — Full entertainment detail.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function getEntertainmentById(req, res) {
  const item = await Entertainment.findById(req.params.id);
  if (!item) throw new AppError('Venue not found', 404);
  sendSuccess(res, { data: item });
}

/**
 * GET /api/entertainment/:id/availability — Ticket tier availability for date.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function getAvailability(req, res) {
  const item = await Entertainment.findById(req.params.id);
  if (!item) throw new AppError('Venue not found', 404);

  const slots = item.ticketTiers.map((tier) => ({
    name: tier.name,
    price: tier.price,
    available: tier.available,
    date: req.query.date || new Date().toISOString().split('T')[0],
  }));

  sendSuccess(res, { data: { entertainmentId: item._id, slots } });
}

/**
 * POST /api/entertainment/book — Book entertainment tickets.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function bookEntertainment(req, res) {
  const { entertainmentId, ticketTier, ticketCount, date } = req.body;

  const item = await Entertainment.findById(entertainmentId);
  if (!item) throw new AppError('Venue not found', 404);

  const tier = item.ticketTiers.find((t) => t.name === ticketTier);
  if (!tier) throw new AppError('Ticket tier not found', 404);
  if (tier.available < ticketCount) {
    throw new AppError('Insufficient tickets available', 409);
  }

  tier.available -= ticketCount;
  await item.save();

  const totalAmount = tier.price * ticketCount;

  const booking = await Booking.create({
    userId: req.user.userId,
    type: 'entertainment',
    provider: item.name,
    entertainmentId: item._id,
    ticketTier,
    ticketCount,
    status: 'confirmed',
    totalAmount,
    metadata: { date, city: item.city },
  });

  sendSuccess(res, {
    statusCode: 201,
    message: 'Tickets booked successfully',
    data: { booking, remaining: tier.available },
  });
}
