/**
 * Application-wide constants for TripAI backend.
 * Centralizes enums, status values, and thresholds used across modules.
 */

/** @type {readonly string[]} */
export const USER_ROLES = ['user', 'admin'];

/** @type {readonly string[]} */
export const MEAL_PREFERENCES = ['veg', 'nonveg', 'both'];

/** @type {readonly string[]} */
export const BOOKING_TYPES = [
  'flight',
  'train',
  'bus',
  'cab',
  'bike',
  'localRide',
  'hotel',
  'entertainment',
];

/** @type {readonly string[]} */
export const BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled', 'failed'];

/** @type {readonly string[]} */
export const PAYMENT_STATUSES = ['pending', 'paid', 'refunded', 'failed'];

/** @type {readonly string[]} */
export const PAYMENT_RECORD_STATUSES = ['pending', 'success', 'failed', 'refunded'];

/** @type {readonly string[]} */
export const PAYMENT_METHODS = ['upi', 'card', 'wallet', 'cash'];

/** @type {readonly string[]} */
export const TRIP_TYPES = ['business', 'leisure', 'family'];

/** @type {readonly string[]} */
export const ITINERARY_STATUSES = ['draft', 'confirmed', 'completed'];

/** @type {readonly string[]} */
export const ALERT_TYPES = ['weather', 'event', 'traffic', 'health'];

/** @type {readonly string[]} */
export const ALERT_SEVERITIES = ['low', 'medium', 'high', 'critical'];

/** @type {readonly string[]} */
export const PROVIDER_STATUSES = ['active', 'warned', 'blocked'];

/** @type {readonly string[]} */
export const ENTERTAINMENT_TYPES = ['tourist', 'movie', 'show'];

/** Provider score thresholds for feedbackScoring service */
export const PROVIDER_SCORE_BLOCKED = 2.5;
export const PROVIDER_SCORE_WARNED = 3.2;
export const PROVIDER_EMA_ALPHA = 0.2;

/** Pagination defaults */
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 50;

/** Mock booking success rate (90%) */
export const MOCK_BOOKING_SUCCESS_RATE = 0.9;

/** Hotel availability cache TTL (5 minutes) */
export const HOTEL_AVAILABILITY_CACHE_MS = 5 * 60 * 1000;

/** JWT default expiry */
export const JWT_DEFAULT_EXPIRY = '7d';
