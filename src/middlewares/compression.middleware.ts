import type {
  INextFunction,
  IRequestContext,
  Middleware,
} from '@thanhhoajs/thanhhoa';
import type { ZlibCompressionOptions } from 'bun';

/**
 * Compression middleware to gzip compress HTTP response bodies.
 *
 * @param {ZlibCompressionOptions} options - Options for zlib compression.
 * @returns {Middleware} Middleware function for compressing responses.
 *
 * @description
 * This middleware checks if the client supports gzip compression via the
 * `Accept-Encoding` header. If supported and the response is compressible
 * (e.g., `application/json`, `text/plain`, `text/html`), it compresses the
 * response using gzip. The `Content-Encoding` header is set to 'gzip', and
 * the `Content-Length` is updated to reflect the size of the compressed data.
 * If the response is already compressed or not compressible, it is returned
 * unchanged. In case of an error during compression, the original response
 * is returned.
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

    try {
      const clone = response.clone();
      const content = await clone.text();

      const stream = new Blob([content]).stream();
      const compressedStream = stream.pipeThrough(
        new CompressionStream('gzip'),
      );
      const compressedData = await new Response(compressedStream).arrayBuffer();

      const headers = new Headers(response.headers);
      headers.set('Content-Encoding', 'gzip');
      headers.set('Content-Length', compressedData.byteLength.toString());
      headers.set('Vary', 'Accept-Encoding');

      return new Response(compressedData, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error) {
      return response;
    }
  };
};
