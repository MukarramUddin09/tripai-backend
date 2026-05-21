/**
 * Feedback scoring service — maintains provider health via EMA score updates.
 */

import ProviderRegistry from '../models/ProviderRegistry.js';
import {
  PROVIDER_EMA_ALPHA,
  PROVIDER_SCORE_BLOCKED,
  PROVIDER_SCORE_WARNED,
  PROVIDER_STATUSES,
} from '../config/constants.js';
import logger from '../utils/logger.js';

/**
 * Derives provider status from current score.
 * @param {number} score - Provider score (0–5)
 * @returns {string}
 */
function deriveStatus(score) {
  if (score < PROVIDER_SCORE_BLOCKED) return 'blocked';
  if (score < PROVIDER_SCORE_WARNED) return 'warned';
  return 'active';
}

/**
 * Updates provider score using exponential moving average (alpha=0.2).
 * @param {string} provider - Provider name
 * @param {number} newRating - New rating (1–5)
 * @param {string} [providerType='general'] - Provider category
 * @returns {Promise<object>}
 */
export async function updateProviderScore(provider, newRating, providerType = 'general') {
  let registry = await ProviderRegistry.findOne({ name: provider });

  if (!registry) {
    registry = await ProviderRegistry.create({
      name: provider,
      type: providerType,
      score: newRating,
      totalRatings: 1,
      status: deriveStatus(newRating),
    });
    logger.info(`Provider registry created for ${provider}`, { score: newRating });
    return registry;
  }

  const newScore =
    PROVIDER_EMA_ALPHA * newRating + (1 - PROVIDER_EMA_ALPHA) * registry.score;

  registry.score = Math.round(newScore * 100) / 100;
  registry.totalRatings += 1;
  registry.status = deriveStatus(registry.score);
  registry.lastUpdated = new Date();
  await registry.save();

  logger.info(`Provider score updated: ${provider}`, {
    score: registry.score,
    status: registry.status,
  });

  return registry;
}

/**
 * Checks provider health status based on score thresholds.
 * @param {string} provider - Provider name
 * @returns {Promise<{provider: string, score: number, status: string}>}
 */
export async function checkProviderHealth(provider) {
  const registry = await ProviderRegistry.findOne({ name: provider });
  if (!registry) {
    return { provider, score: 4, status: 'active' };
  }
  return {
    provider: registry.name,
    score: registry.score,
    status: registry.status,
  };
}

/**
 * Returns all providers below the blocked threshold.
 * @returns {Promise<object[]>}
 */
export async function getBlacklistedProviders() {
  return ProviderRegistry.find({
    score: { $lt: PROVIDER_SCORE_BLOCKED },
    status: PROVIDER_STATUSES[2],
  }).lean();
}
