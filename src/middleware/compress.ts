/**
 * Compression middleware for ThanhHoaJS
 * Compresses response bodies using brotli, gzip, or deflate
 */

import type { Middleware } from '../shared/types';

export interface CompressOptions {
  /** Minimum size in bytes to compress (default: 1024) */
  threshold?: number;
  /** Preferred encoding order (default: ['br', 'gzip', 'deflate']) */
  encoding?: ('br' | 'gzip' | 'deflate')[];
}

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
 * Automatically compresses responses above threshold.
 * Supports br (Brotli), gzip, and deflate — in that preference order by default.
 *
 * @example
 * app.use(compress({ threshold: 1024 }));
 * app.use(compress({ encoding: ['gzip'] })); // gzip only
 */
export const compress = (options: CompressOptions = {}): Middleware => {
  const threshold = options.threshold ?? 1024;
  const preferredOrder = options.encoding ?? ['br', 'gzip', 'deflate'];

  return async (ctx, next) => {
    const response = await next();
    const acceptEncoding = ctx.request.headers.get('Accept-Encoding') || '';

    let encoding: 'br' | 'gzip' | 'deflate' | null = null;
    for (const enc of preferredOrder) {
      if (acceptEncoding.includes(enc)) {
        encoding = enc;
        break;
      }
    }

    if (!encoding) {
      return response;
    }

    const contentType = response.headers.get('Content-Type') || '';
    const isCompressible = COMPRESSIBLE_TYPES.some((type) =>
      contentType.includes(type),
    );
    if (!isCompressible) {
      return response;
    }

    if (!response.body) {
      return response;
    }

    const body = await response.arrayBuffer();

    if (body.byteLength < threshold) {
      return new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    }

    const data = new Uint8Array(body);
    let compressed: Uint8Array;
    let finalEncoding: string = encoding;

    if (encoding === 'br') {
      if (typeof (Bun as any).brotliCompressSync === 'function') {
        compressed = (Bun as any).brotliCompressSync(data);
      } else {
        finalEncoding = 'gzip';
        compressed = Bun.gzipSync(data);
      }
    } else if (encoding === 'gzip') {
      compressed = Bun.gzipSync(data);
    } else {
      compressed = Bun.deflateSync(data);
    }

    const headers = new Headers(response.headers);
    headers.set('Content-Encoding', finalEncoding);
    headers.set('Content-Length', compressed!.byteLength.toString());
    headers.set('Vary', 'Accept-Encoding');

    return new Response(compressed! as unknown as BodyInit, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
};
