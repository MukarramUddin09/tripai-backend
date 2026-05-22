/**
 * Payment route definitions for TripAI API.
 */

import { Router } from 'express';
import Joi from 'joi';
import * as paymentController from '../controllers/payment.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { PAYMENT_METHODS } from '../config/constants.js';

const router = Router();

router.use(authenticate);

const initiateSchema = Joi.object({
  bookingId: Joi.string().hex().length(24).required(),
  amount: Joi.number().min(1).required(),
  method: Joi.string()
    .valid(...PAYMENT_METHODS)
    .required(),
  currency: Joi.string().default('INR'),
});

const verifySchema = Joi.object({
  paymentId: Joi.string().hex().length(24).required(),
  razorpay_order_id: Joi.string().required(),
  razorpay_payment_id: Joi.string().required(),
  razorpay_signature: Joi.string().required(),
});

const invoiceSchema = Joi.object({
  paymentId: Joi.string().hex().length(24).required(),
  gstin: Joi.string(),
  buyerName: Joi.string().required(),
});

const directUpiSchema = Joi.object({
  bookingId: Joi.string().hex().length(24).required(),
  amount: Joi.number().min(1).required(),
  upiId: Joi.string().required(),
  note: Joi.string(),
});

router.post('/initiate', validate({ body: initiateSchema }), asyncHandler(paymentController.initiatePayment));
router.post('/verify', validate({ body: verifySchema }), asyncHandler(paymentController.verifyPayment));
router.get('/history', asyncHandler(paymentController.getPaymentHistory));
router.post(
  '/generate-invoice',
  validate({ body: invoiceSchema }),
  asyncHandler(paymentController.generateInvoice),
);
router.post(
  '/direct-upi',
  validate({ body: directUpiSchema }),
  asyncHandler(paymentController.directUpiPayment),
);

export default router;
