/**
 * Entertainment route definitions for TripAI API.
 */

import { Router } from 'express';
import Joi from 'joi';
import * as entertainmentController from '../controllers/entertainment.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

const bookSchema = Joi.object({
  entertainmentId: Joi.string().hex().length(24).required(),
  ticketTier: Joi.string().required(),
  ticketCount: Joi.number().integer().min(1).required(),
  date: Joi.date().iso(),
});

router.get('/search', asyncHandler(entertainmentController.searchEntertainment));
router.get('/:id', asyncHandler(entertainmentController.getEntertainmentById));
router.get('/:id/availability', asyncHandler(entertainmentController.getAvailability));
router.post(
  '/book',
  authenticate,
  validate({ body: bookSchema }),
  asyncHandler(entertainmentController.bookEntertainment),
);

export default router;
