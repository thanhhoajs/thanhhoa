import type {
  INextFunction,
  IRequestContext,
  Middleware,
} from '@thanhhoajs/thanhhoa';
import type { ZlibCompressionOptions } from 'bun';

/**
 * Creates a middleware that compresses the response body using Gzip.
 *
 * @param {ZlibCompressionOptions} [options] - Options for the Gzip compression.
 * @returns {Middleware} A middleware that compresses the response body.
 *
 * @description
 * This middleware compresses the response body using Gzip. The response body is compressed
 * only if the request headers include `Accept-Encoding: gzip`. The middleware sets the
 * `Content-Encoding` header to `gzip` and the `Content-Length` header to the length of the
 * compressed body.
 *
 * @example
 * app.use(compression());
 */
export const compression = (options: ZlibCompressionOptions): Middleware => {
  return async (
    context: IRequestContext,
    next: INextFunction,
  ): Promise<Response> => {
    const response = await next();

    // Check Accept-Encoding header
    const acceptEncoding = context.request.headers.get('accept-encoding') || '';
    if (!acceptEncoding.includes('gzip')) {
      return response;
    }

    // Get response body as ArrayBuffer
    const body = await response.arrayBuffer();

    // Compress the response body using Bun.gzipSync
    const compressed = Bun.gzipSync(body, options);

    const headers = new Headers(response.headers);
    headers.set('Content-Encoding', 'gzip');
    headers.set('Content-Length', compressed.length.toString());
    headers.delete('content-length');

    // Returns a new response with a compressed body
    return new Response(compressed, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
};
