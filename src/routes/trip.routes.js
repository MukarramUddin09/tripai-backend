/**
 * Trip planning route definitions for TripAI API.
 */

import { Router } from 'express';
import Joi from 'joi';
import * as tripController from '../controllers/trip.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

const planSchema = Joi.object({
  from: Joi.string().required(),
  to: Joi.string().required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso(),
  passengers: Joi.number().integer().min(1),
  preferences: Joi.object(),
});

const tripSchema = Joi.object({
  title: Joi.string().required(),
  from: Joi.string().required(),
  to: Joi.string().required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().required(),
  tripType: Joi.string().valid('business', 'leisure', 'family'),
  passengers: Joi.number().integer().min(1),
});

router.post('/plan', validate({ body: planSchema }), asyncHandler(tripController.planTrip));
router.post('/', validate({ body: tripSchema }), asyncHandler(tripController.createTrip));
router.get('/', asyncHandler(tripController.getTrips));
router.get('/:id', asyncHandler(tripController.getTripById));

export default router;
