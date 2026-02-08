/**
 * Timeout middleware for ThanhHoaJS
 * Aborts requests that exceed the time limit
 */

import type { Middleware } from '../shared/types';

export interface TimeoutOptions {
  /** Timeout in milliseconds (default: 30000 = 30s) */
  ms?: number;
  /** Error message on timeout */
  message?: string;
  /** Status code on timeout (default: 408) */
  statusCode?: number;
}

/**
 * Timeout middleware
 * Aborts requests that exceed the specified time limit
 *
 * @example
 * app.use(timeout({ ms: 5000 })); // 5 seconds
 */
export const timeout = (options: TimeoutOptions = {}): Middleware => {
  const ms = options.ms ?? 30000;
  const message = options.message ?? 'Request timeout';
  const statusCode = options.statusCode ?? 408;

  return async (ctx, next) => {
    const timeoutPromise = new Promise<Response>((_, reject) => {
      setTimeout(() => {
        reject(
          new Response(
            JSON.stringify({
              error: 'Request Timeout',
              message,
              timeout: ms,
            }),
            {
              status: statusCode,
              headers: { 'Content-Type': 'application/json' },
            },
          ),
        );
      }, ms);
    });

    try {
      const response = await Promise.race([next(), timeoutPromise]);
      return response;
    } catch (error) {
      if (error instanceof Response) {
        return error;
      }
      throw error;
    }
  };
};
