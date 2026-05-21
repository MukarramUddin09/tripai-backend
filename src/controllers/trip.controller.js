/**
 * Trip controller — CRUD for user trips and agent-orchestrated planning.
 */

import Trip from '../models/Trip.js';
import { orchestrateTrip } from '../services/agentOrchestrator.service.js';
import { AppError } from '../middlewares/errorHandler.middleware.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * POST /api/trips/plan — Orchestrate a full trip plan via AI agents.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function planTrip(req, res) {
  const plan = await orchestrateTrip(req.body);
  sendSuccess(res, { message: 'Trip plan generated', data: plan });
}

/**
 * POST /api/trips — Create a new trip record.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function createTrip(req, res) {
  const trip = await Trip.create({ ...req.body, userId: req.user.userId });
  sendSuccess(res, { statusCode: 201, message: 'Trip created', data: trip });
}

/**
 * GET /api/trips — List user's trips.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function getTrips(req, res) {
  const trips = await Trip.find({ userId: req.user.userId }).sort({ startDate: -1 });
  sendSuccess(res, { data: trips });
}

/**
 * GET /api/trips/:id — Get trip by ID.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function getTripById(req, res) {
  const trip = await Trip.findOne({ _id: req.params.id, userId: req.user.userId });
  if (!trip) throw new AppError('Trip not found', 404);
  sendSuccess(res, { data: trip });
}
