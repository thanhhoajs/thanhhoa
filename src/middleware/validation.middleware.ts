/**
 * Request validation middleware using ajv
 * Fast JSON Schema validation
 */

import Ajv, { type JSONSchemaType, type ValidateFunction } from 'ajv';
import { json } from '../utils/response.utils';
import type { Middleware } from '../shared/types';

// Singleton Ajv instance for performance
const ajv = new Ajv({
  allErrors: true,
  removeAdditional: true,
  useDefaults: true,
  coerceTypes: true,
});

// Cache compiled validators
const validatorCache = new Map<string, ValidateFunction>();

/**
 * Create validation middleware for request body
 *
 * @example
 * const userSchema = {
 *   type: 'object',
 *   properties: {
 *     name: { type: 'string', minLength: 1 },
 *     email: { type: 'string', format: 'email' }
 *   },
 *   required: ['name', 'email']
 * };
 *
 * app.post('/users', handler, [validate(userSchema)]);
 */
export const validate = <T>(
  schema: JSONSchemaType<T> | object,
  options?: { cacheKey?: string },
): Middleware => {
  // Get or compile validator
  let validator: ValidateFunction;
  const cacheKey = options?.cacheKey || JSON.stringify(schema);

  if (validatorCache.has(cacheKey)) {
    validator = validatorCache.get(cacheKey)!;
  } else {
    validator = ajv.compile(schema);
    validatorCache.set(cacheKey, validator);
  }

  return async (ctx, next) => {
    try {
      const body = await ctx.request.clone().json();

      if (!validator(body)) {
        return json(
          {
            error: 'Validation failed',
            details: validator.errors?.map((e) => ({
              path: e.instancePath || '/',
              message: e.message,
              params: e.params,
            })),
          },
          400,
        );
      }

      // Store validated body in context for handler
      (ctx as any).validatedBody = body;

      return next();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }
  };
};

/**
 * Validate query parameters
 */
export const validateQuery = <T>(
  schema: JSONSchemaType<T> | object,
  options?: { cacheKey?: string },
): Middleware => {
  let validator: ValidateFunction;
  const cacheKey = options?.cacheKey || 'query:' + JSON.stringify(schema);

  if (validatorCache.has(cacheKey)) {
    validator = validatorCache.get(cacheKey)!;
  } else {
    validator = ajv.compile(schema);
    validatorCache.set(cacheKey, validator);
  }

  return async (ctx, next) => {
    if (!validator(ctx.query)) {
      return json(
        {
          error: 'Query validation failed',
          details: validator.errors?.map((e) => ({
            path: e.instancePath || '/',
            message: e.message,
          })),
        },
        400,
      );
    }

    return next();
  };
};

/**
 * Validate route parameters
 */
export const validateParams = <T>(
  schema: JSONSchemaType<T> | object,
  options?: { cacheKey?: string },
): Middleware => {
  let validator: ValidateFunction;
  const cacheKey = options?.cacheKey || 'params:' + JSON.stringify(schema);

  if (validatorCache.has(cacheKey)) {
    validator = validatorCache.get(cacheKey)!;
  } else {
    validator = ajv.compile(schema);
    validatorCache.set(cacheKey, validator);
  }

  return async (ctx, next) => {
    if (!validator(ctx.params)) {
      return json(
        {
          error: 'Params validation failed',
          details: validator.errors?.map((e) => ({
            path: e.instancePath || '/',
            message: e.message,
          })),
        },
        400,
      );
    }

    return next();
  };
};

export { ajv };
