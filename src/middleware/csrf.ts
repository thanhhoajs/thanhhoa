/**
 * CSRF protection middleware
 * Double-submit cookie pattern
 */

import type { Middleware } from '../shared/types';
import { json } from '../utils/response.utils';

interface CSRFOptions {
  /** Cookie name (default: _csrf) */
  cookie?: string;
  /** Header name to check (default: X-CSRF-Token) */
  header?: string;
  /** Form field name (default: _csrf) */
  field?: string;
  /** Token length in bytes (default: 32) */
  tokenLength?: number;
  /** Cookie options */
  cookieOptions?: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
    path?: string;
    maxAge?: number;
  };
  /** Safe methods that don't require CSRF check */
  safeMethods?: string[];
  /** Skip paths */
  skip?: string[] | ((path: string) => boolean);
  /** Custom error handler */
  onError?: () => Response;
}

/**
 * Generate cryptographically secure random token
 */
const generateToken = (length: number): string => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Timing-safe string comparison to prevent timing attacks
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
 * CSRF protection middleware using double-submit cookie pattern
 *
 * @example
 * app.use(csrf());
 *
 * // Get token for forms
 * app.get('/form', (ctx) => {
 *   const token = ctx.csrfToken;
 *   return html(`<input type="hidden" name="_csrf" value="${token}">`);
 * });
 */
export const csrf = (options: CSRFOptions = {}): Middleware => {
  const {
    cookie = '_csrf',
    header = 'X-CSRF-Token',
    field = '_csrf',
    tokenLength = 32,
    cookieOptions = {},
    safeMethods = ['GET', 'HEAD', 'OPTIONS'],
    skip,
    onError,
  } = options;

  const defaultCookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict' as const,
    path: '/',
    ...cookieOptions,
  };

  const errorResponse =
    onError || (() => json({ error: 'Invalid CSRF token' }, 403));

  return async (ctx, next) => {
    const url = new URL(ctx.request.url);

    // Check skip paths
    if (skip) {
      const shouldSkip =
        typeof skip === 'function'
          ? skip(url.pathname)
          : skip.some((p) => url.pathname.startsWith(p));
      if (shouldSkip) {
        return next();
      }
    }

    // Get or generate token
    let token = ctx.cookies.get(cookie);
    if (!token) {
      token = generateToken(tokenLength);
      ctx.cookies.set(cookie, token, defaultCookieOptions);
    }

    // Attach token to context for templates
    (ctx as any).csrfToken = token;

    // Skip validation for safe methods
    if (safeMethods.includes(ctx.request.method)) {
      return next();
    }

    // Get submitted token
    let submittedToken: string | null = null;

    // Check header first
    submittedToken = ctx.request.headers.get(header);

    // Check form body if no header
    if (!submittedToken) {
      try {
        const contentType = ctx.request.headers.get('Content-Type') || '';
        if (contentType.includes('application/x-www-form-urlencoded')) {
          const body = await ctx.request.clone().text();
          const params = new URLSearchParams(body);
          submittedToken = params.get(field);
        } else if (contentType.includes('multipart/form-data')) {
          const formData = await ctx.request.clone().formData();
          submittedToken = formData.get(field) as string | null;
        } else if (contentType.includes('application/json')) {
          const body = await ctx.request.clone().json();
          submittedToken = body[field];
        }
      } catch {
        // Ignore parsing errors
      }
    }

    // Check query parameter as last resort
    if (!submittedToken) {
      submittedToken = ctx.query[field] || null;
    }

    // Validate token
    if (!submittedToken || !timingSafeEqual(token, submittedToken)) {
      return errorResponse();
    }

    return next();
  };
};

/**
 * Generate a standalone CSRF token (for API use)
 */
export const generateCSRFToken = (length: number = 32): string => {
  return generateToken(length);
};
