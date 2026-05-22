/**
 * Alert monitor service — fetches and upserts city alerts on a scheduled interval.
 */

import Alert from '../models/Alert.js';
import Trip from '../models/Trip.js';
import { env } from '../config/env.js';
import logger from '../utils/logger.js';

/** @type {NodeJS.Timeout|null} */
let monitorInterval = null;

/**
 * Maps OpenWeather condition to alert severity.
 * @param {string} main - OWM weather main field
 * @returns {'low'|'medium'|'high'|'critical'}
 */
function weatherSeverity(main) {
  const m = (main || '').toLowerCase();
  if (['thunderstorm', 'tornado', 'hurricane'].includes(m)) return 'critical';
  if (['rain', 'snow', 'squall'].includes(m)) return 'medium';
  if (['extreme', 'drizzle'].includes(m)) return 'high';
  return 'low';
}

/**
 * Fetches live weather alerts from OpenWeatherMap.
 * @param {string} city - City name
 * @returns {Promise<object[]>}
 */
export async function fetchWeatherAlert(city) {
  if (!env.openWeatherApiKey) {
    logger.warn('[AlertMonitor] OPENWEATHER_API_KEY not set — skipping weather fetch');
    return [];
  }

  const url =
    `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}` +
    `&appid=${env.openWeatherApiKey}&units=metric`;

  const res = await fetch(url);
  if (!res.ok) {
    logger.warn(`[AlertMonitor] OpenWeather failed for ${city}`, { status: res.status });
    return [];
  }

  const data = await res.json();
  const condition = data.weather?.[0]?.main || 'Unknown';
  const description = data.weather?.[0]?.description || condition;
  const temp = data.main?.temp;
  const humidity = data.main?.humidity;
  const wind = data.wind?.speed;

  return [
    {
      city,
      type: 'weather',
      severity: weatherSeverity(condition),
      title: `Weather Alert: ${condition} in ${city}`,
      message: `${description}. Temp ${temp}°C, humidity ${humidity}%, wind ${wind} m/s. Plan accordingly.`,
      source: 'OpenWeatherMap',
      expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
    },
  ];
}

/**
 * Mock local news/event alerts for a city.
 * @param {string} city - City name
 * @returns {Promise<object[]>}
 */
export async function fetchNewsAlerts(city) {
  await new Promise((r) => setTimeout(r, 100));
  const events = [
    { title: 'Road closure on main highway', type: 'traffic', severity: 'medium' },
    { title: 'Local festival — expect crowds', type: 'event', severity: 'low' },
    { title: 'Health advisory: air quality moderate', type: 'health', severity: 'low' },
  ];

  const pick = events[Math.floor(Math.random() * events.length)];
  return [
    {
      city,
      type: pick.type,
      severity: pick.severity,
      title: pick.title,
      message: `${pick.title} reported in ${city}.`,
      source: 'Mock Local News Feed',
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
    },
  ];
}

/**
 * Upserts alert documents for a city.
 * @param {string} city - City name
 * @returns {Promise<number>} Number of alerts upserted
 */
export async function upsertAlertsForCity(city) {
  const [weather, news] = await Promise.all([
    fetchWeatherAlert(city),
    fetchNewsAlerts(city),
  ]);

  const allAlerts = [...weather, ...news];
  let count = 0;

  for (const alertData of allAlerts) {
    await Alert.findOneAndUpdate(
      { city: alertData.city, title: alertData.title, type: alertData.type },
      { ...alertData, isActive: true },
      { upsert: true, new: true },
    );
    count++;
  }

  return count;
}

/**
 * Fetches active trip destinations and refreshes alerts for each city.
 * @returns {Promise<void>}
 */
export async function refreshAllDestinationAlerts() {
  const activeTrips = await Trip.find({
    status: { $in: ['planning', 'booked', 'in_progress'] },
  }).distinct('to');

  const cities = [...new Set(activeTrips.map((c) => c?.trim()).filter(Boolean))];

  if (!cities.length) {
    logger.debug('[AlertMonitor] No active trip destinations to monitor');
    return;
  }

  logger.info(`[AlertMonitor] Refreshing alerts for ${cities.length} cities`);

  for (const city of cities) {
    try {
      const count = await upsertAlertsForCity(city);
      logger.info(`[AlertMonitor] Upserted ${count} alerts for ${city}`);
    } catch (err) {
      logger.error(`[AlertMonitor] Failed for ${city}`, { message: err.message });
    }
  }
}

/**
 * Starts the alert monitor interval (every 10 minutes).
 * @returns {void}
 */
export function startAlertMonitor() {
  if (monitorInterval) return;

  logger.info('[AlertMonitor] Starting alert monitor (10 min interval)');
  monitorInterval = setInterval(
    () => refreshAllDestinationAlerts().catch((e) => logger.error(e.message)),
    10 * 60 * 1000,
  );

  refreshAllDestinationAlerts().catch((e) => logger.error(e.message));
}

/**
 * Stops the alert monitor interval.
 * @returns {void}
 */
export function stopAlertMonitor() {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
    logger.info('[AlertMonitor] Stopped');
  }
}
