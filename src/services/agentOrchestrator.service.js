/**
 * Agent orchestrator service — coordinates multi-domain trip planning.
 * Parallelizes transport, hotel, and fare searches; logs each agent step.
 */

import * as fareComparison from './fareComparison.service.js';
import Hotel from '../models/Hotel.js';
import logger from '../utils/logger.js';

const TRANSPORT_TYPES = ['flight', 'train', 'bus'];

/**
 * Searches hotels for trip destination city.
 * @param {string} city - Destination city
 * @param {object} [prefs] - User preferences
 * @returns {Promise<object[]>}
 */
async function searchHotelsForTrip(city, prefs = {}) {
  logger.info(`[Agent] Hotel search for ${city}`);
  const query = { city: new RegExp(city, 'i'), isActive: true };
  if (prefs.budget) query.pricePerNight = { $lte: prefs.budget / 3 };
  const hotels = await Hotel.find(query).sort({ rating: -1 }).limit(5).lean();
  return hotels;
}

/**
 * Orchestrates a full trip plan across transport types and hotels.
 * @param {object} tripRequest - Trip planning request
 * @param {string} tripRequest.from - Origin
 * @param {string} tripRequest.to - Destination
 * @param {string|Date} tripRequest.startDate - Start date
 * @param {string|Date} [tripRequest.endDate] - End date
 * @param {object} [tripRequest.preferences] - User preferences
 * @returns {Promise<object>} Unified trip plan
 */
export async function orchestrateTrip(tripRequest) {
  const { from, to, startDate, preferences = {} } = tripRequest;

  logger.info('[Agent] Starting trip orchestration', { from, to, startDate });

  const searchParams = {
    from,
    to,
    date: startDate,
    passengers: tripRequest.passengers || 1,
    class: preferences.class || '3A',
  };

  const transportTasks = TRANSPORT_TYPES.map(async (type) => {
    logger.info(`[Agent] Searching ${type} options`);
    const { results, bestOption } = await fareComparison.searchAndRank(
      type,
      searchParams,
      preferences.ranking || 'price',
    );
    return { type, results, bestOption };
  });

  const [transportResults, hotels] = await Promise.all([
    Promise.all(transportTasks),
    searchHotelsForTrip(to, preferences),
  ]);

  const plan = {
    from,
    to,
    startDate,
    transport: transportResults.reduce((acc, t) => {
      acc[t.type] = { options: t.results, recommended: t.bestOption };
      return acc;
    }, {}),
    hotels: { options: hotels, recommended: hotels[0] || null },
    estimatedTotal: transportResults.reduce((sum, t) => {
      return sum + (t.bestOption?.price || 0);
    }, hotels[0]?.pricePerNight || 0),
    generatedAt: new Date().toISOString(),
  };

  logger.info('[Agent] Trip orchestration complete', {
    transportOptions: transportResults.reduce((s, t) => s + t.results.length, 0),
    hotelCount: hotels.length,
  });

  return plan;
}
