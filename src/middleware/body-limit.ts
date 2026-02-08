/**
 * Body size limit middleware for ThanhHoaJS
 * Protects against large payload attacks
 */

import type { Middleware } from '../shared/types';

export interface BodyLimitOptions {
  /** Maximum body size in bytes (default: 1MB) */
  maxSize?: number;
  /** Error message when limit exceeded */
  message?: string;
  /** Status code when limit exceeded (default: 413) */
  statusCode?: number;
}

/**
 * Body limit middleware
 * Rejects requests with body larger than maxSize
 *
 * @example
 * app.use(bodyLimit({ maxSize: 1024 * 1024 })); // 1MB
 */
export const bodyLimit = (options: BodyLimitOptions = {}): Middleware => {
  const maxSize = options.maxSize ?? 1024 * 1024; // 1MB default
  const message = options.message ?? 'Request body too large';
  const statusCode = options.statusCode ?? 413;

  return async (ctx, next) => {
    const contentLength = ctx.request.headers.get('Content-Length');

    // Check Content-Length header first (fast path)
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (!isNaN(size) && size > maxSize) {
        return new Response(
          JSON.stringify({
            error: 'Payload Too Large',
            message,
            maxSize,
            received: size,
          }),
          {
            status: statusCode,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }
    }

    // For streaming bodies without Content-Length, we need to check during parsing
    // This is handled at the handler level when they call ctx.json() etc.

    return next();
  };
};
