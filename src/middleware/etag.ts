/**
 * ETag middleware for conditional HTTP caching
 * Generates ETags for responses and handles If-None-Match
 */

import type { Middleware } from '../shared/types';

interface ETagOptions {
  /** Use weak ETags (default: true) */
  weak?: boolean;
  /** Hash algorithm: 'fnv1a' (fast) or 'sha256' (secure) */
  algorithm?: 'fnv1a' | 'sha256';
  /** Minimum body size to process (default: 0) */
  threshold?: number;
}

/**
 * Fast FNV-1a hash for ETag generation
 * Supports both string and Uint8Array
 */
const fnv1a = (data: string | Uint8Array): string => {
  let hash = 2166136261;

  if (typeof data === 'string') {
    for (let i = 0; i < data.length; i++) {
      hash ^= data.charCodeAt(i);
      hash = (hash * 16777619) >>> 0;
    }
  } else {
    for (let i = 0; i < data.length; i++) {
      hash ^= data[i];
      hash = (hash * 16777619) >>> 0;
    }
  }

  return hash.toString(36);
};

/**
 * Generate hash using Web Crypto API (SHA-256)
 */
const sha256Hash = async (data: string | Uint8Array): Promise<string> => {
  const buffer =
    typeof data === 'string' ? new TextEncoder().encode(data) : data;

  // Using native Bun crypto if available for performance, otherwise Web Crypto
  // @ts-ignore
  if (typeof Bun !== 'undefined' && Bun.SHA256) {
    // @ts-ignore
    const hash = Bun.SHA256.hash(buffer, 'hex');
    // @ts-ignore
    return typeof hash === 'string'
      ? hash.slice(0, 16)
      : Array.from(hash as Uint8Array)
          .slice(0, 8)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
  }

  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer as any);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .slice(0, 8) // Shorten to first 8 bytes (16 hex chars) for ETag to save space
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * ETag middleware - generates ETags and handles conditional requests
 * Supports text and binary responses
 *
 * @example
 * app.use(etag());
 * // or with options
 * app.use(etag({ weak: false, algorithm: 'sha256' }));
 */
export const etag = (options: ETagOptions = {}): Middleware => {
  const { weak = true, algorithm = 'fnv1a', threshold = 0 } = options;

  return async (ctx, next) => {
    const response = await next();

    // Skip if already has ETag or not cacheable
    if (
      response.headers.has('ETag') ||
      response.status < 200 ||
      response.status >= 300
    ) {
      return response;
    }

    // Skip for streaming responses (no body or Unreadable body)
    if (!response.body) {
      return response;
    }

    // Clone response to read body
    // We use arrayBuffer to support both text and binary
    const cloned = response.clone();
    let bodyData: Uint8Array;

    try {
      const buffer = await cloned.arrayBuffer();
      if (buffer.byteLength < threshold) {
        return response;
      }
      bodyData = new Uint8Array(buffer);
    } catch {
      // Body might be a stream that can't be buffered easily
      return response;
    }

    // Generate ETag
    let hash: string;
    if (algorithm === 'sha256') {
      hash = await sha256Hash(bodyData);
    } else {
      hash = fnv1a(bodyData);
    }

    const etagValue = weak ? `W/"${hash}"` : `"${hash}"`;

    // Check If-None-Match header
    const ifNoneMatch = ctx.request.headers.get('If-None-Match');
    if (ifNoneMatch) {
      const tags = ifNoneMatch.split(',').map((tag) => tag.trim());
      const matches = tags.some((tag) => {
        // Handle weak comparison
        const normalizedTag = tag.replace(/^W\//, '');
        const normalizedEtag = etagValue.replace(/^W\//, '');
        return normalizedTag === normalizedEtag || tag === '*';
      });

      if (matches) {
        return new Response(null, {
          status: 304,
          headers: {
            ETag: etagValue,
          },
        });
      }
    }

    const newHeaders = new Headers(response.headers);
    newHeaders.set('ETag', etagValue);

    return new Response((bodyData as any) || response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  };
};
