/**
 * Itinerary route definitions for TripAI API.
 */

import { Router } from 'express';
import Joi from 'joi';
import * as itineraryController from '../controllers/itinerary.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

const itinerarySchema = Joi.object({
  title: Joi.string().required(),
  destination: Joi.string().required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().required(),
  tripType: Joi.string().valid('business', 'leisure', 'family'),
  days: Joi.array(),
  totalBudget: Joi.number().min(0),
});

const dayItemSchema = Joi.object({
  time: Joi.string(),
  type: Joi.string().required(),
  name: Joi.string().required(),
  provider: Joi.string(),
  cost: Joi.number().min(0),
  notes: Joi.string(),
});

router.get('/share/:shareToken', asyncHandler(itineraryController.getSharedItinerary));

router.use(authenticate);

router.post('/', validate({ body: itinerarySchema }), asyncHandler(itineraryController.createItinerary));
router.get('/', asyncHandler(itineraryController.getItineraries));
router.get('/:id', asyncHandler(itineraryController.getItineraryById));
router.get('/:id/export', asyncHandler(itineraryController.exportItinerary));
const updateItinerarySchema = itinerarySchema.fork(
  ['title', 'destination', 'startDate', 'endDate'],
  (field) => field.optional(),
);
router.put('/:id', validate({ body: updateItinerarySchema }), asyncHandler(itineraryController.updateItinerary));
router.delete('/:id', asyncHandler(itineraryController.deleteItinerary));
router.post('/:id/generate-share-link', asyncHandler(itineraryController.generateShareLink));
router.post(
  '/:id/days/:dayIndex/items',
  validate({ body: dayItemSchema }),
  asyncHandler(itineraryController.addDayItem),
);
router.put(
  '/:id/days/:dayIndex/items/:itemId',
  validate({ body: dayItemSchema }),
  asyncHandler(itineraryController.updateDayItem),
);
router.delete('/:id/days/:dayIndex/items/:itemId', asyncHandler(itineraryController.removeDayItem));

export default router;
