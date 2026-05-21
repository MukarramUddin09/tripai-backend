/**
 * Alert route definitions for TripAI API.
 */

import { Router } from 'express';
import Joi from 'joi';
import * as alertController from '../controllers/alert.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

const cityQuerySchema = Joi.object({
  city: Joi.string().required(),
});

const subscribeSchema = Joi.object({
  city: Joi.string().required(),
});

router.get('/', validate({ query: cityQuerySchema }), asyncHandler(alertController.getAlerts));
router.get(
  '/weather',
  validate({ query: cityQuerySchema }),
  asyncHandler(alertController.getWeatherAlerts),
);
router.post(
  '/subscribe',
  authenticate,
  validate({ body: subscribeSchema }),
  asyncHandler(alertController.subscribeAlerts),
);

export default router;
