/**
 * Alert controller — city alerts, weather, and subscription management.
 */

import Alert from '../models/Alert.js';
import User from '../models/User.js';
import { fetchWeatherAlert } from '../services/alertMonitor.service.js';
import { AppError } from '../middlewares/errorHandler.middleware.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * GET /api/alerts — Active alerts for a city.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function getAlerts(req, res) {
  const { city } = req.query;
  if (!city) throw new AppError('City query parameter is required', 400);

  const alerts = await Alert.find({
    city: new RegExp(city, 'i'),
    isActive: true,
    expiresAt: { $gt: new Date() },
  }).sort({ severity: -1, createdAt: -1 });

  sendSuccess(res, { data: alerts });
}

/**
 * GET /api/alerts/weather — Weather-specific alerts for a city.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function getWeatherAlerts(req, res) {
  const { city } = req.query;
  if (!city) throw new AppError('City query parameter is required', 400);

  const stored = await Alert.find({
    city: new RegExp(city, 'i'),
    type: 'weather',
    isActive: true,
    expiresAt: { $gt: new Date() },
  });

  if (stored.length) {
    return sendSuccess(res, { data: stored });
  }

  const fresh = await fetchWeatherAlert(city);
  sendSuccess(res, { data: fresh, message: 'Live weather alerts' });
}

/**
 * POST /api/alerts/subscribe — Subscribe user to city alerts.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function subscribeAlerts(req, res) {
  const { city } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.userId,
    { $addToSet: { 'preferences.alertCities': city } },
    { new: true, runValidators: true },
  );
  if (!user) throw new AppError('User not found', 404);

  sendSuccess(res, {
    message: `Subscribed to alerts for ${city}`,
    data: { alertCities: user.preferences?.alertCities || [] },
  });
}
