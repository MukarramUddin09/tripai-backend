/**
 * Feedback route definitions for TripAI API.
 */

import { Router } from 'express';
import Joi from 'joi';
import * as feedbackController from '../controllers/feedback.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

const feedbackSchema = Joi.object({
  bookingId: Joi.string().hex().length(24),
  provider: Joi.string().required(),
  providerType: Joi.string().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().max(2000),
  tags: Joi.array().items(Joi.string()),
  isPublic: Joi.boolean(),
});

router.post(
  '/',
  authenticate,
  validate({ body: feedbackSchema }),
  asyncHandler(feedbackController.submitFeedback),
);
router.get('/provider/:name', asyncHandler(feedbackController.getProviderFeedback));
router.get('/my', authenticate, asyncHandler(feedbackController.getMyFeedback));

export default router;
