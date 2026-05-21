/**
 * Hotel route definitions for TripAI API.
 */

import { Router } from 'express';
import Joi from 'joi';
import * as hotelController from '../controllers/hotel.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

const searchQuerySchema = Joi.object({
  city: Joi.string(),
  checkIn: Joi.date().iso(),
  checkOut: Joi.date().iso(),
  guests: Joi.number().integer().min(1),
  roomType: Joi.string(),
  maxPrice: Joi.number(),
  minStars: Joi.number().min(1).max(5),
  mealPreference: Joi.string().valid('veg', 'nonveg', 'both'),
});

const bookSchema = Joi.object({
  hotelId: Joi.string().hex().length(24).required(),
  roomType: Joi.string().required(),
  checkIn: Joi.date().iso().required(),
  checkOut: Joi.date().iso().required(),
  guests: Joi.number().integer().min(1).required(),
  mealPreference: Joi.string().valid('veg', 'nonveg', 'both'),
});

router.get('/search', validate({ query: searchQuerySchema }), asyncHandler(hotelController.searchHotels));
router.get('/bookings', authenticate, asyncHandler(hotelController.getHotelBookings));
router.get('/:id/availability', asyncHandler(hotelController.getHotelAvailability));
router.get('/:id', asyncHandler(hotelController.getHotelById));
router.post('/book', authenticate, validate({ body: bookSchema }), asyncHandler(hotelController.bookHotel));
router.put(
  '/bookings/:id/cancel',
  authenticate,
  asyncHandler(hotelController.cancelHotelBooking),
);

export default router;
