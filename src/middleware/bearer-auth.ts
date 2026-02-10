/**
 * Bearer token authentication middleware
 * For API key or custom token authentication
 */

import type { Middleware } from '../shared/types';
import { json } from '../utils/response.utils';

interface BearerAuthOptions {
  /** Static token to validate against */
  token?: string;
  /** Custom token validation function */
  validate?: (token: string) => boolean | Promise<boolean>;
  /** Header name (default: Authorization) */
  header?: string;
  /** Custom token prefix (default: Bearer) */
  prefix?: string;
  /** Skip paths */
  skip?: string[] | ((path: string) => boolean);
  /** Custom error handler */
  onError?: (message: string) => Response;
}

/**
 * Timing-safe string comparison
 */
const timingSafeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
};

/**
 * Bearer token authentication middleware
 *
 * @example
 * // Static token
 * app.use(bearerAuth({ token: process.env.API_KEY }));
 *
 * // Custom validation
 * app.use(bearerAuth({
 *   validate: async (token) => {
 *     return await db.isValidApiKey(token);
 *   }
 * }));
 */
export const bearerAuth = (options: BearerAuthOptions): Middleware => {
  const {
    token,
    validate,
    header = 'Authorization',
    prefix = 'Bearer',
    skip,
    onError,
  } = options;

  const errorResponse = onError || ((msg: string) => json({ error: msg }, 401));

  if (!token && !validate) {
    throw new Error(
      'bearerAuth: Either token or validate function is required',
    );
  }

  return async (ctx, next) => {
    // Check skip paths
    if (skip) {
      const url = new URL(ctx.request.url);
      const shouldSkip =
        typeof skip === 'function'
          ? skip(url.pathname)
          : skip.some((p) => url.pathname.startsWith(p));
      if (shouldSkip) {
        return next();
      }
    }

    const authHeader = ctx.request.headers.get(header);
    const expectedPrefix = `${prefix} `;

    if (!authHeader || !authHeader.startsWith(expectedPrefix)) {
      return errorResponse('Missing or invalid authorization header');
    }

    const providedToken = authHeader.slice(expectedPrefix.length);

    if (!providedToken) {
      return errorResponse('Missing token');
    }

    // Validate token
    let isValid: boolean;

    if (validate) {
      isValid = await validate(providedToken);
    } else if (token) {
      isValid = timingSafeEqual(providedToken, token);
    } else {
      isValid = false;
    }

    if (!isValid) {
      return errorResponse('Invalid token');
    }

    // Attach token to context
    (ctx as any).bearerToken = providedToken;

    return next();
  };
};
