/**
 * Provider adapter service — routes search/book requests to mock or real providers.
 * Abstraction layer for swapping mockProviders with live API integrations.
 */

import * as mockProviders from '../utils/mockProviders.js';
import logger from '../utils/logger.js';

/** @type {Record<string, Function>} */
const SEARCH_HANDLERS = {
  flight: (params) =>
    mockProviders.mockFlightSearch(params.from, params.to, params.date, params.passengers),
  train: (params) =>
    mockProviders.mockTrainSearch(params.from, params.to, params.date, params.class),
  bus: (params) => mockProviders.mockBusSearch(params.from, params.to, params.date),
  cab: (params) => mockProviders.mockCabSearch(params.from, params.to),
  bike: (params) => mockProviders.mockBikeSearch(params.from, params.to),
  localRide: (params) => mockProviders.mockLocalRideSearch(params.from, params.to),
};

/**
 * Invokes the appropriate provider search handler for a transport type.
 * @param {string} type - Transport type (flight, train, bus, etc.)
 * @param {object} searchParams - Search parameters
 * @returns {Promise<object[]>}
 */
export async function searchProvider(type, searchParams) {
  const handler = SEARCH_HANDLERS[type];
  if (!handler) {
    logger.warn(`No provider handler for type: ${type}`);
    return [];
  }
  return handler(searchParams);
}

/**
 * Confirms a booking with the provider adapter.
 * @param {object} bookingDetails - Booking details for provider
 * @returns {Promise<object>}
 */
export async function confirmWithProvider(bookingDetails) {
  return mockProviders.mockConfirmBooking(bookingDetails);
}

/**
 * Initiates a refund via provider adapter.
 * @param {string} providerBookingId - Provider booking reference
 * @param {number} amount - Refund amount
 * @returns {Promise<object>}
 */
export async function refundWithProvider(providerBookingId, amount) {
  return mockProviders.mockInitiateRefund(providerBookingId, amount);
}
