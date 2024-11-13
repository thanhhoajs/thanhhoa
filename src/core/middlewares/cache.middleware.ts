import type {
  INextFunction,
  IRequestContext,
  Middleware,
} from '@thanhhoajs/thanhhoa';
import crypto from 'crypto';

export const cacheMiddleware = (): Middleware => {
  return async (context: IRequestContext, next: INextFunction) => {
    const response = await next();

    const headers = new Headers(response.headers);
    headers.set('Vary', 'Accept-Encoding');
    const etag = crypto
      .createHash('md5')
      .update(await response.text())
      .digest('hex');
    headers.set('ETag', `W/"${etag}"`);
    headers.set('Last-Modified', new Date().toUTCString());

    return new Response(response.body, {
      status: response.status,
      headers,
    });
  };
};
