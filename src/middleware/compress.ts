/**
 * Compression middleware for ThanhHoaJS
 * Compresses response bodies using gzip or deflate
 */

import type { Middleware } from '../shared/types';

export interface CompressOptions {
  /** Minimum size in bytes to compress (default: 1024) */
  threshold?: number;
  /** Preferred encoding (default: 'gzip') */
  encoding?: 'gzip' | 'deflate';
}

// Compressible MIME types - pre-allocated for zero runtime allocation
const COMPRESSIBLE_TYPES = [
  'text/',
  'application/json',
  'application/javascript',
  'application/xml',
  'application/xhtml+xml',
  'image/svg+xml',
];

/**
 * Compression middleware
 * Automatically compresses responses above threshold
 *
 * @example
 * app.use(compress({ threshold: 1024 }));
 */
export const compress = (options: CompressOptions = {}): Middleware => {
  const threshold = options.threshold ?? 1024;
  const preferredEncoding = options.encoding ?? 'gzip';

  return async (ctx, next) => {
    const response = await next();
    const acceptEncoding = ctx.request.headers.get('Accept-Encoding') || '';

    // Check if client accepts compression
    const supportsGzip = acceptEncoding.includes('gzip');
    const supportsDeflate = acceptEncoding.includes('deflate');

    if (!supportsGzip && !supportsDeflate) {
      return response;
    }

    // Check content type - only compress text-based content
    const contentType = response.headers.get('Content-Type') || '';
    const isCompressible = COMPRESSIBLE_TYPES.some((type) =>
      contentType.includes(type),
    );
    if (!isCompressible) {
      return response;
    }

    // Get body
    const body = await response.arrayBuffer();

    // Check threshold
    if (body.byteLength < threshold) {
      return new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    }

    // Determine encoding
    let encoding: 'gzip' | 'deflate';
    if (preferredEncoding === 'gzip' && supportsGzip) {
      encoding = 'gzip';
    } else if (preferredEncoding === 'deflate' && supportsDeflate) {
      encoding = 'deflate';
    } else if (supportsGzip) {
      encoding = 'gzip';
    } else {
      encoding = 'deflate';
    }

    // Compress using Bun's native compression with correct algorithm
    const data = new Uint8Array(body);
    const compressed =
      encoding === 'gzip' ? Bun.gzipSync(data) : Bun.deflateSync(data);

    const headers = new Headers(response.headers);
    headers.set('Content-Encoding', encoding);
    headers.set('Content-Length', compressed.byteLength.toString());
    headers.set('Vary', 'Accept-Encoding');

    return new Response(compressed, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
};
