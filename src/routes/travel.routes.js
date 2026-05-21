/**
 * Travel booking route definitions for TripAI API.
 */

import { Router } from 'express';
import Joi from 'joi';
import * as travelController from '../controllers/travel.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { BOOKING_TYPES } from '../config/constants.js';

const router = Router();

router.use(authenticate);

const searchSchema = Joi.object({
  type: Joi.string()
    .valid(...BOOKING_TYPES.filter((t) => t !== 'hotel' && t !== 'entertainment'))
    .required(),
  from: Joi.string().required(),
  to: Joi.string().required(),
  date: Joi.date().iso().required(),
  passengers: Joi.number().integer().min(1).default(1),
  class: Joi.string().optional(),
  preference: Joi.string().valid('price', 'time').default('price'),
});

const bookSchema = Joi.object({
  resultId: Joi.string().required(),
  provider: Joi.string().required(),
  type: Joi.string().required(),
  from: Joi.string().required(),
  to: Joi.string().required(),
  departureTime: Joi.date().iso(),
  arrivalTime: Joi.date().iso(),
  passengers: Joi.number().integer().min(1),
  class: Joi.string(),
  totalAmount: Joi.number().min(0).required(),
  tripId: Joi.string().hex().length(24),
  metadata: Joi.object(),
});

const localRideSchema = Joi.object({
  from: Joi.string().required(),
  to: Joi.string().required(),
  preference: Joi.string().valid('price', 'time'),
});

router.post('/search', validate({ body: searchSchema }), asyncHandler(travelController.searchTravel));
router.post('/book', validate({ body: bookSchema }), asyncHandler(travelController.bookTravel));
router.get('/bookings', asyncHandler(travelController.getBookings));
router.get('/bookings/:id', asyncHandler(travelController.getBookingById));
router.delete('/bookings/:id/cancel', asyncHandler(travelController.cancelBooking));
router.post(
  '/local-rides/search',
  validate({ body: localRideSchema }),
  asyncHandler(travelController.searchLocalRides),
);

export default router;
