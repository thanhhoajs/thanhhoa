import type {
  INextFunction,
  IRequestContext,
  Middleware,
} from '@thanhhoajs/thanhhoa';

export const cacheMiddleware = (): Middleware => {
  return async (context: IRequestContext, next: INextFunction) => {
    const response = await next();

    const headers = new Headers(response.headers);
    headers.set('Vary', 'Accept-Encoding');
    headers.set('ETag', `W/"${Date.now()}"`);
    headers.set('Last-Modified', new Date().toUTCString());

    return new Response(response.body, {
      status: response.status,
      headers,
    });
  };
};
