import type { Middleware } from '../shared/types';
import { randomUUID } from 'crypto';

interface RequestIdOptions {
  header?: string;
  generator?: () => string;
}

/**
 * Request ID middleware
 * Adds a unique ID to the request and response headers
 */
export const requestId = (options: RequestIdOptions = {}): Middleware => {
  const header = options.header || 'X-Request-ID';
  const generator = options.generator || randomUUID;

  return async (ctx, next) => {
    const existingId = ctx.request.headers.get(header);
    const id = existingId || generator();

    // Add to request headers for downstream use
    ctx.request.headers.set(header, id);

    const response = await next();

    // Add to response headers
    response.headers.set(header, id);

    return response;
  };
};
