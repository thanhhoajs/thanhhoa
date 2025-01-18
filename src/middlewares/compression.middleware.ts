import type {
  INextFunction,
  IRequestContext,
  Middleware,
} from '@thanhhoajs/thanhhoa';
import type { ZlibCompressionOptions } from 'bun';
import { gzipSync } from 'zlib';

/**
 * Compression middleware that applies Gzip compression to HTTP responses.
 *
 * @param {ZlibCompressionOptions} options - Configuration options for Gzip compression.
 * @returns {Middleware} A middleware function that compresses responses if applicable.
 *
 * @description
 * This middleware checks the client's `Accept-Encoding` header for Gzip support.
 * If supported and the response meets the criteria for compression (e.g., JSON, plain text, or HTML),
 * it compresses the response body using Gzip and sets the appropriate headers.
 *
 * - Skips compression if the `Content-Encoding` is already set to `gzip`.
 * - Handles JSON responses by parsing, stringifying, and compressing them.
 * - Handles streaming responses by reading chunks, combining them, and compressing the combined data.
 * - For other responses, compresses the response body directly if necessary.
 *
 * If the response cannot be compressed or an error occurs during compression,
 * the original response is returned without modification.
 */

export const compression = (options: ZlibCompressionOptions): Middleware => {
  return async (
    context: IRequestContext,
    next: INextFunction,
  ): Promise<Response> => {
    const response = await next();

    const acceptEncoding = context.request.headers.get('accept-encoding') || '';
    if (!acceptEncoding.includes('gzip')) {
      return response;
    }

    const contentEncoding = response.headers.get('content-encoding');
    if (contentEncoding && contentEncoding.includes('gzip')) {
      return response;
    }

    const contentType = response.headers.get('content-type') || '';
    const shouldCompress =
      contentType.includes('application/json') ||
      contentType.includes('text/plain') ||
      contentType.includes('text/html');

    if (!shouldCompress) {
      return response;
    }

    // Handle JSON specifically
    if (contentType.includes('application/json')) {
      const clone = response.clone();
      try {
        const data = await clone.json();
        const jsonString = JSON.stringify(data);
        const textEncoder = new TextEncoder();
        const compressed = gzipSync(textEncoder.encode(jsonString));

        const headers = new Headers(response.headers);
        headers.set('Content-Encoding', 'gzip');
        headers.set('Content-Length', compressed.length.toString());

        return new Response(compressed, {
          status: response.status,
          headers,
        });
      } catch (error) {
        // If JSON parsing fails, return original response
        return response;
      }
    }

    // Handle streaming response
    if (response.body instanceof ReadableStream) {
      const chunks: Uint8Array[] = [];
      const reader = response.body.getReader();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }

        // Combine chunks into single Uint8Array
        const totalLength = chunks.reduce(
          (acc, chunk) => acc + chunk.length,
          0,
        );
        const combined = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          combined.set(chunk, offset);
          offset += chunk.length;
        }

        const compressed = gzipSync(combined, options);

        const headers = new Headers(response.headers);
        headers.set('Content-Encoding', 'gzip');
        headers.set('Content-Length', compressed.length.toString());

        return new Response(compressed, {
          status: response.status,
          headers,
        });
      } catch (error) {
        return response;
      }
    }

    // Handle regular responses
    try {
      const body = await response.arrayBuffer();
      const compressed = gzipSync(new Uint8Array(body), options);

      const headers = new Headers(response.headers);
      headers.set('Content-Encoding', 'gzip');
      headers.set('Content-Length', compressed.length.toString());

      return new Response(compressed, {
        status: response.status,
        headers,
      });
    } catch (error) {
      return response;
    }
  };
};
