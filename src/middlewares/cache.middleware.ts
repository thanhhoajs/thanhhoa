import { LRUCache } from 'lru-cache';
import type {
  INextFunction,
  IRequestContext,
  Middleware,
} from '@thanhhoajs/thanhhoa';
import { gzipSync } from 'bun';
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
    const cachedResponse = cache.get(cacheKey);
    if (cachedResponse) return cachedResponse.clone();

    const response = await next();
    const contentType = response.headers.get('Content-Type') || '';

    const shouldCompress =
      contentType.includes('text') ||
      contentType.includes('javascript') ||
      contentType.includes('json') ||
      contentType.includes('xml');

    const body = await response.arrayBuffer();

    // Generate ETag
    const hash = await crypto.subtle.digest('SHA-1', body);
    const etag = `"${Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')}"`;

    // Check If-None-Match header
    const ifNoneMatch = context.request.headers.get('If-None-Match');
    if (ifNoneMatch === etag) {
      return new Response(null, { status: 304 });
    }

    // Compress response if supported
    const acceptEncoding = context.request.headers.get('Accept-Encoding') || '';
    const isGzipSupported = acceptEncoding.includes('gzip');

    const headers = new Headers(response.headers);
    headers.set('ETag', etag);
    headers.set('Cache-Control', 'public, max-age=3600');

    if (isGzipSupported && shouldCompress && body.byteLength > 1024) {
      const compressed = gzipSync(new Uint8Array(body));
      headers.set('Content-Encoding', 'gzip');
      headers.set('Content-Length', compressed.byteLength.toString());
      const compressedResponse = new Response(compressed, {
        status: response.status,
        headers,
      });
      cache.set(cacheKey, compressedResponse.clone());
      return compressedResponse;
    }

    const finalResponse = new Response(body, {
      status: response.status,
      headers,
    });
    cache.set(cacheKey, finalResponse.clone());
    return finalResponse;
  };
};
