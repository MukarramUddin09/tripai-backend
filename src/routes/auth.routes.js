/**
 * Authentication route definitions for TripAI API.
 */

import { Router } from 'express';
import Joi from 'joi';
import * as authController from '../controllers/auth.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authRateLimiter } from '../middlewares/rateLimit.middleware.js';

const router = Router();

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  phone: Joi.string().min(10).max(15).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const profileSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  phone: Joi.string().min(10).max(15),
  avatar: Joi.string().uri().allow(null, ''),
  preferences: Joi.object({
    meal: Joi.string().valid('veg', 'nonveg', 'both'),
    budget: Joi.number().min(0),
    preferredTransport: Joi.array().items(Joi.string()),
    alertCities: Joi.array().items(Joi.string()),
  }),
});

const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
});

const googleAuthSchema = Joi.object({
  credential: Joi.string().required(),
});

router.post(
  '/register',
  authRateLimiter,
  validate({ body: registerSchema }),
  asyncHandler(authController.register),
);

router.post(
  '/login',
  authRateLimiter,
  validate({ body: loginSchema }),
  asyncHandler(authController.login),
);

router.post(
  '/google',
  authRateLimiter,
  validate({ body: googleAuthSchema }),
  asyncHandler(authController.googleAuth),
);

router.post('/logout', authenticate, asyncHandler(authController.logout));
router.get('/me', authenticate, asyncHandler(authController.getMe));
router.put(
  '/profile',
  authenticate,
  validate({ body: profileSchema }),
  asyncHandler(authController.updateProfile),
);
router.post(
  '/change-password',
  authenticate,
  validate({ body: changePasswordSchema }),
  asyncHandler(authController.changePassword),
);

export default router;
