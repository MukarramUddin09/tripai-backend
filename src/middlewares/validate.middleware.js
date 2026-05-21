/**
 * Joi schema validation middleware for TripAI REST endpoints.
 * Validates request body, query, and params against provided schemas.
 */

import { AppError } from './errorHandler.middleware.js';

/**
 * Creates validation middleware for body, query, and/or params.
 * @param {object} [schemas] - Joi schemas keyed by source
 * @param {import('joi').Schema} [schemas.body] - Body validation schema
 * @param {import('joi').Schema} [schemas.query] - Query validation schema
 * @param {import('joi').Schema} [schemas.params] - Params validation schema
 * @returns {import('express').RequestHandler}
 */
export function validate(schemas = {}) {
  return (req, _res, next) => {
    const sources = ['body', 'query', 'params'];

    for (const source of sources) {
      if (!schemas[source]) continue;

      const { error, value } = schemas[source].validate(req[source], {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const message = error.details.map((d) => d.message).join('; ');
        return next(new AppError(message, 400));
      }

      req[source] = value;
    }

    next();
  };
}
