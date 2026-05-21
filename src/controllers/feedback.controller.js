/**
 * Feedback controller — submit and retrieve provider/user feedback.
 */

import Feedback from '../models/Feedback.js';
import * as feedbackScoring from '../services/feedbackScoring.service.js';
import { AppError } from '../middlewares/errorHandler.middleware.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { DEFAULT_PAGE_SIZE } from '../config/constants.js';

/**
 * POST /api/feedback — Submit feedback and update provider score.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function submitFeedback(req, res) {
  const { bookingId, provider, providerType, rating, comment, tags, isPublic } = req.body;

  const feedback = await Feedback.create({
    userId: req.user.userId,
    bookingId,
    provider,
    providerType,
    rating,
    comment,
    tags,
    isPublic: isPublic !== false,
  });

  const registry = await feedbackScoring.updateProviderScore(
    provider,
    rating,
    providerType,
  );

  sendSuccess(res, {
    statusCode: 201,
    message: 'Feedback submitted',
    data: { feedback, providerHealth: registry },
  });
}

/**
 * GET /api/feedback/provider/:name — Public feedback for a provider.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function getProviderFeedback(req, res) {
  const feedbacks = await Feedback.find({
    provider: req.params.name,
    isPublic: true,
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .select('-userId');

  const health = await feedbackScoring.checkProviderHealth(req.params.name);

  sendSuccess(res, { data: { feedbacks, providerHealth: health } });
}

/**
 * GET /api/feedback/my — Current user's feedback history.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function getMyFeedback(req, res) {
  const page = parseInt(req.query.page, 10) || 1;
  const skip = (page - 1) * DEFAULT_PAGE_SIZE;

  const feedbacks = await Feedback.find({ userId: req.user.userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(DEFAULT_PAGE_SIZE);

  sendSuccess(res, { data: feedbacks });
}
