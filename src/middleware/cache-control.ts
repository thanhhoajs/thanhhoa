/**
 * Cache-Control middleware for ThanhHoaJS
 * Sets Cache-Control and related caching headers on responses
 */

import type { Middleware } from '../shared/types';

export interface CacheControlOptions {
  /**
   * Max age in seconds for shared/public cache (CDN, proxy).
   * Sets `public, max-age=<n>`.
   * @default undefined
   */
  maxAge?: number;

  /**
   * Max age in seconds for the browser cache only.
   * Sets `private, max-age=<n>`.
   * @default undefined
   */
  privateMaxAge?: number;

  /**
   * Stale-while-revalidate window in seconds.
   * Allows serving stale content while revalidating in background.
   * @default undefined
   */
  staleWhileRevalidate?: number;

  /**
   * Stale-if-error window in seconds.
   * Serves stale content if origin errors.
   * @default undefined
   */
  staleIfError?: number;

  /**
   * Disable caching entirely (sensitive data, user-specific content).
   * Sets `no-store`.
   */
  noStore?: boolean;

  /**
   * Sets `no-cache` — must revalidate on every request.
   */
  noCache?: boolean;

  /**
   * Sets `must-revalidate` — don't serve stale after max-age expires.
   */
  mustRevalidate?: boolean;

  /**
   * Sets `immutable` — tell browser asset will never change.
   * Best used with content-hashed file URLs.
   */
  immutable?: boolean;

  /**
   * Override the full Cache-Control directive string directly.
   */
  directive?: string;

  /**
   * Skip caching for specific paths or a custom function.
   */
  skip?: string[] | ((path: string) => boolean);
}

/**
 * Cache-Control middleware
 *
 * @example
 * // Disable caching for API routes
 * app.group('/api', (r) => { ... }, [cacheControl({ noStore: true })]);
 *
 * // Public CDN-cacheable assets with stale-while-revalidate
 * app.use(cacheControl({ maxAge: 3600, staleWhileRevalidate: 60 }));
 *
 * // Long-lived immutable assets
 * app.use(cacheControl({ maxAge: 31536000, immutable: true }));
 *
 * // Private per-user content
 * app.use(cacheControl({ privateMaxAge: 300 }));
 */
export const cacheControl = (options: CacheControlOptions = {}): Middleware => {
  const {
    maxAge,
    privateMaxAge,
    staleWhileRevalidate,
    staleIfError,
    noStore,
    noCache,
    mustRevalidate,
    immutable,
    directive,
    skip,
  } = options;

  let builtDirective: string;
  if (directive) {
    builtDirective = directive;
  } else if (noStore) {
    builtDirective = 'no-store';
  } else {
    const parts: string[] = [];

    if (noCache) {
      parts.push('no-cache');
    }

    if (privateMaxAge !== undefined) {
      parts.push('private');
      parts.push(`max-age=${privateMaxAge}`);
    } else if (maxAge !== undefined) {
      parts.push('public');
      parts.push(`max-age=${maxAge}`);
    }

    if (staleWhileRevalidate !== undefined) {
      parts.push(`stale-while-revalidate=${staleWhileRevalidate}`);
    }
    if (staleIfError !== undefined) {
      parts.push(`stale-if-error=${staleIfError}`);
    }
    if (mustRevalidate) {
      parts.push('must-revalidate');
    }
    if (immutable) {
      parts.push('immutable');
    }

    builtDirective = parts.join(', ');
  }

  return async (ctx, next) => {
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

    const response = await next();

    if (builtDirective && response.status >= 200 && response.status < 400) {
      response.headers.set('Cache-Control', builtDirective);
    }

    return response;
  };
};

/**
 * Helper: no-store (sensitive data, auth responses)
 * @example app.use(noStore());
 */
export const noStore = (): Middleware => cacheControl({ noStore: true });

/**
 * Helper: no-cache (always revalidate)
 * @example app.use(noCache());
 */
export const noCache = (): Middleware =>
  cacheControl({ noCache: true, mustRevalidate: true });

/**
 * Helper: public CDN cache
 * @example app.use(publicCache(3600)); // 1 hour
 */
export const publicCache = (
  maxAge: number,
  opts?: Pick<
    CacheControlOptions,
    'staleWhileRevalidate' | 'staleIfError' | 'immutable'
  >,
): Middleware => cacheControl({ maxAge, ...opts });

/**
 * Helper: private browser-only cache
 * @example app.use(privateCache(300)); // 5 minutes
 */
export const privateCache = (privateMaxAge: number): Middleware =>
  cacheControl({ privateMaxAge });
