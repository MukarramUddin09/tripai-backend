/**
 * Itinerary controller — CRUD, day items, sharing, and export.
 */

import { v4 as uuidv4 } from 'uuid';
import Itinerary from '../models/Itinerary.js';
import { AppError } from '../middlewares/errorHandler.middleware.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * POST /api/itineraries — Create new itinerary.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function createItinerary(req, res) {
  const itinerary = await Itinerary.create({
    ...req.body,
    userId: req.user.userId,
  });
  sendSuccess(res, { statusCode: 201, message: 'Itinerary created', data: itinerary });
}

/**
 * GET /api/itineraries — List user's itineraries.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function getItineraries(req, res) {
  const itineraries = await Itinerary.find({ userId: req.user.userId }).sort({
    startDate: -1,
  });
  sendSuccess(res, { data: itineraries });
}

/**
 * GET /api/itineraries/:id — Full itinerary detail.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function getItineraryById(req, res) {
  const itinerary = await Itinerary.findOne({
    _id: req.params.id,
    userId: req.user.userId,
  });
  if (!itinerary) throw new AppError('Itinerary not found', 404);
  sendSuccess(res, { data: itinerary });
}

/**
 * PUT /api/itineraries/:id — Update itinerary.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function updateItinerary(req, res) {
  const itinerary = await Itinerary.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.userId },
    req.body,
    { new: true, runValidators: true },
  );
  if (!itinerary) throw new AppError('Itinerary not found', 404);
  sendSuccess(res, { message: 'Itinerary updated', data: itinerary });
}

/**
 * DELETE /api/itineraries/:id — Delete itinerary.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function deleteItinerary(req, res) {
  const result = await Itinerary.findOneAndDelete({
    _id: req.params.id,
    userId: req.user.userId,
  });
  if (!result) throw new AppError('Itinerary not found', 404);
  sendSuccess(res, { message: 'Itinerary deleted', data: null });
}

/**
 * POST /api/itineraries/:id/days/:dayIndex/items — Add item to a day.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function addDayItem(req, res) {
  const dayIndex = parseInt(req.params.dayIndex, 10);
  const itinerary = await Itinerary.findOne({
    _id: req.params.id,
    userId: req.user.userId,
  });
  if (!itinerary) throw new AppError('Itinerary not found', 404);
  if (!itinerary.days[dayIndex]) throw new AppError('Day not found', 404);

  itinerary.days[dayIndex].items.push(req.body);
  itinerary.totalSpent += req.body.cost || 0;
  await itinerary.save();

  sendSuccess(res, { statusCode: 201, data: itinerary });
}

/**
 * PUT /api/itineraries/:id/days/:dayIndex/items/:itemId — Update day item.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function updateDayItem(req, res) {
  const dayIndex = parseInt(req.params.dayIndex, 10);
  const itinerary = await Itinerary.findOne({
    _id: req.params.id,
    userId: req.user.userId,
  });
  if (!itinerary) throw new AppError('Itinerary not found', 404);

  const item = itinerary.days[dayIndex]?.items.id(req.params.itemId);
  if (!item) throw new AppError('Item not found', 404);

  Object.assign(item, req.body);
  await itinerary.save();

  sendSuccess(res, { data: itinerary });
}

/**
 * DELETE /api/itineraries/:id/days/:dayIndex/items/:itemId — Remove day item.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function removeDayItem(req, res) {
  const dayIndex = parseInt(req.params.dayIndex, 10);
  const itinerary = await Itinerary.findOne({
    _id: req.params.id,
    userId: req.user.userId,
  });
  if (!itinerary) throw new AppError('Itinerary not found', 404);

  const item = itinerary.days[dayIndex]?.items.id(req.params.itemId);
  if (!item) throw new AppError('Item not found', 404);

  itinerary.totalSpent -= item.cost || 0;
  item.deleteOne();
  await itinerary.save();

  sendSuccess(res, { message: 'Item removed', data: itinerary });
}

/**
 * GET /api/itineraries/share/:shareToken — Public limited itinerary view.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function getSharedItinerary(req, res) {
  const itinerary = await Itinerary.findOne({ sharedLink: req.params.shareToken }).select(
    'title destination startDate endDate days.status days.date tripType',
  );
  if (!itinerary) throw new AppError('Shared itinerary not found', 404);

  sendSuccess(res, {
    data: {
      title: itinerary.title,
      destination: itinerary.destination,
      startDate: itinerary.startDate,
      endDate: itinerary.endDate,
      tripType: itinerary.tripType,
    },
  });
}

/**
 * POST /api/itineraries/:id/generate-share-link — Create UUID share token.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function generateShareLink(req, res) {
  const shareToken = uuidv4();
  const itinerary = await Itinerary.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.userId },
    { sharedLink: shareToken },
    { new: true },
  );
  if (!itinerary) throw new AppError('Itinerary not found', 404);

  sendSuccess(res, {
    data: { shareToken, shareUrl: `/api/itineraries/share/${shareToken}` },
  });
}

/**
 * GET /api/itineraries/:id/export — Export itinerary as PDF-ready JSON.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function exportItinerary(req, res) {
  const itinerary = await Itinerary.findOne({
    _id: req.params.id,
    userId: req.user.userId,
  }).lean();
  if (!itinerary) throw new AppError('Itinerary not found', 404);

  const exportData = {
    meta: {
      title: itinerary.title,
      destination: itinerary.destination,
      exportedAt: new Date().toISOString(),
      format: 'tripai-itinerary-v1',
    },
    schedule: itinerary.days,
    budget: {
      total: itinerary.totalBudget,
      spent: itinerary.totalSpent,
      remaining: itinerary.totalBudget - itinerary.totalSpent,
    },
    documents: itinerary.documents,
  };

  sendSuccess(res, { data: exportData, message: 'Export ready for PDF generation' });
}
