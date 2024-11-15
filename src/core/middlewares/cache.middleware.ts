import type {
  INextFunction,
  IRequestContext,
  Middleware,
} from '@thanhhoajs/thanhhoa';
import * as crypto from 'crypto';

export const cacheMiddleware = (): Middleware => {
  return async (context: IRequestContext, next: INextFunction) => {
    const response = await next();
    const body = await response.arrayBuffer();
    const etag = `"${await crypto.subtle.digest('SHA-1', body).then((hash) =>
      Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(''),
    )}"`;

    const headers = new Headers(response.headers);
    headers.set('ETag', etag);
    headers.set('Cache-Control', 'public, max-age=3600');

    const ifNoneMatch = context.request.headers.get('If-None-Match');
    if (ifNoneMatch === etag) {
      return new Response(null, { status: 304, headers });
    }

    return new Response(body, {
      status: response.status,
      headers,
    });
  };
};
