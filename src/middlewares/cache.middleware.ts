import { LRUCache } from 'lru-cache';
import type {
  INextFunction,
  IRequestContext,
  Middleware,
} from '@thanhhoajs/thanhhoa';
import * as crypto from 'crypto';

const cache = new LRUCache<string, Response>({
  max: 1000,
  ttl: 3600 * 1000,
});

export const cacheMiddleware = (): Middleware => {
  return async (context: IRequestContext, next: INextFunction) => {
    if (context.request.method !== 'GET') {
      return next();
    }

    const cacheKey = context.request.url;
    const ifNoneMatch = context.request.headers.get('If-None-Match');
    const cachedResponse = cache.get(cacheKey);

    // Return cached response if ETag matches
    if (cachedResponse) {
      const cachedEtag = cachedResponse.headers.get('ETag');

      // If we have an If-None-Match header and it matches our ETag
      if (ifNoneMatch && cachedEtag === ifNoneMatch) {
        return new Response(null, {
          status: 304,
          headers: new Headers({
            ETag: cachedEtag,
            'Cache-Control': 'public, max-age=3600',
          }),
        });
      }

      // Return cached response if it exists
      return cachedResponse.clone();
    }

    // Process new response
    const response = await next();
    const body = await response.arrayBuffer();

    // Generate ETag
    const hash = await crypto.subtle.digest('SHA-1', body);
    const etag = `"${Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')}"`;

    const headers = new Headers(response.headers);
    headers.set('ETag', etag);
    headers.set('Cache-Control', 'public, max-age=3600');

    // Create final response
    const finalResponse = new Response(body, {
      status: response.status,
      headers,
    });

    // Cache the response
    cache.set(cacheKey, finalResponse.clone());

    return finalResponse;
  };
};
