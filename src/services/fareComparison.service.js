/**
 * Fare comparison service — aggregates multi-provider search results and ranking.
 * Uses Promise.allSettled for resilient parallel provider calls.
 */

import ProviderRegistry from '../models/ProviderRegistry.js';
import { searchProvider } from './providerAdapter.service.js';
import logger from '../utils/logger.js';

/**
 * Searches all relevant mock providers in parallel for a transport type.
 * @param {string} type - Transport type
 * @param {object} searchParams - Search parameters (from, to, date, etc.)
 * @returns {Promise<object[]>} Combined successful results
 */
export async function searchAllProviders(type, searchParams) {
  const providers = [type];

  const tasks = providers.map((p) =>
    searchProvider(p, searchParams).then((results) =>
      results.map((r) => ({ ...r, searchType: type })),
    ),
  );

  const settled = await Promise.allSettled(tasks);
  const combined = [];

  settled.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      combined.push(...result.value);
    } else {
      logger.warn(`Provider search failed for ${providers[index]}`, {
        reason: result.reason?.message,
      });
    }
  });

  return combined;
}

/**
 * Selects the best fare option based on user preference.
 * @param {object[]} results - Search results array
 * @param {string} [preference='price'] - 'price' or 'time'
 * @returns {object|null}
 */
export function selectBestOption(results, preference = 'price') {
  if (!results.length) return null;

  if (preference === 'time') {
    return [...results].sort(
      (a, b) => (a.durationMinutes || 9999) - (b.durationMinutes || 9999),
    )[0];
  }

  return [...results].sort((a, b) => a.price - b.price)[0];
}

/**
 * Filters results to providers above score threshold in registry.
 * @param {object[]} results - Search results
 * @param {object[]} [providerRegistry] - Provider registry documents
 * @param {number} [threshold=2.5] - Minimum acceptable score
 * @returns {object[]}
 */
export function rankByProviderScore(results, providerRegistry = [], threshold = 2.5) {
  const scoreMap = new Map(providerRegistry.map((p) => [p.name, p.score]));

  return results
    .filter((r) => {
      const score = scoreMap.get(r.provider);
      if (score === undefined) return true;
      return score >= threshold;
    })
    .sort((a, b) => {
      const scoreA = scoreMap.get(a.provider) ?? 5;
      const scoreB = scoreMap.get(b.provider) ?? 5;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return a.price - b.price;
    });
}

/**
 * Full search pipeline: parallel fetch, filter by provider health, rank.
 * @param {string} type - Transport type
 * @param {object} searchParams - Search parameters
 * @param {string} [preference='price'] - Ranking preference
 * @returns {Promise<{results: object[], bestOption: object|null}>}
 */
export async function searchAndRank(type, searchParams, preference = 'price') {
  const raw = await searchAllProviders(type, searchParams);
  const registry = await ProviderRegistry.find({ type }).lean();
  const ranked = rankByProviderScore(raw, registry);
  const bestOption = selectBestOption(ranked, preference);

  return { results: ranked, bestOption, aiRecommended: bestOption };
}
