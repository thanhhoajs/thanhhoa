/**
 * HTTP Basic Authentication middleware
 */

import type { Middleware } from '../shared/types';

interface BasicAuthOptions {
  /** Username to validate */
  username: string;
  /** Password to validate */
  password: string;
  /** Realm for WWW-Authenticate header */
  realm?: string;
  /** Custom validation function (overrides username/password) */
  validate?: (username: string, password: string) => boolean | Promise<boolean>;
  /** Skip paths */
  skip?: string[] | ((path: string) => boolean);
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
 * Create 401 Unauthorized response
 */
const unauthorized = (realm: string): Response => {
  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${realm}", charset="UTF-8"`,
    },
  });
};

/**
 * HTTP Basic Authentication middleware
 *
 * @example
 * // Simple credentials
 * app.use(basicAuth({
 *   username: 'admin',
 *   password: 'secret'
 * }));
 *
 * // Custom validation
 * app.use(basicAuth({
 *   username: '',
 *   password: '',
 *   validate: async (user, pass) => {
 *     return await db.verifyUser(user, pass);
 *   }
 * }));
 */
export const basicAuth = (options: BasicAuthOptions): Middleware => {
  const { username, password, realm = 'Secure Area', validate, skip } = options;

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

    const authHeader = ctx.request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return unauthorized(realm);
    }

    try {
      // Decode Base64 credentials
      const base64Credentials = authHeader.slice(6);
      const credentials = atob(base64Credentials);
      const colonIndex = credentials.indexOf(':');

      if (colonIndex === -1) {
        return unauthorized(realm);
      }

      const providedUsername = credentials.substring(0, colonIndex);
      const providedPassword = credentials.substring(colonIndex + 1);

      // Validate credentials
      let isValid: boolean;

      if (validate) {
        isValid = await validate(providedUsername, providedPassword);
      } else {
        isValid =
          timingSafeEqual(providedUsername, username) &&
          timingSafeEqual(providedPassword, password);
      }

      if (!isValid) {
        return unauthorized(realm);
      }

      // Attach username to context
      (ctx as any).basicAuthUser = providedUsername;

      return next();
    } catch {
      return unauthorized(realm);
    }
  };
};
