import {
  type IRequestContext,
  type INextFunction,
  type Middleware,
  ThanhHoaResponse,
  HttpException,
  type ICORSOptions,
} from '@thanhhoajs/thanhhoa';

const defaultCORSOptions: ICORSOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  maxAge: 86400,
  secureHeaders: true,
};

/**
 * CORS middleware to handle Cross-Origin Resource Sharing settings for HTTP requests.
 *
 * @param {ICORSOptions} [options=defaultCORSOptions] - Configuration options for CORS.
 * @returns {Middleware} A middleware function that applies CORS headers to the response.
 *
 * @description
 * This middleware function allows you to configure CORS settings such as allowed origins, methods,
 * headers, credentials, and other security headers for HTTP responses. It sets the appropriate
 * CORS headers based on the provided options or defaults if no options are specified.
 *
 * @example
 * app.use(corsMiddleware());
 */
export const corsMiddleware = (
  options: ICORSOptions = defaultCORSOptions,
): Middleware => {
  const corsOptions = { ...defaultCORSOptions, ...options };

  return async (context: IRequestContext, next: INextFunction) => {
    let response: Response;

    try {
      response = await next();
    } catch (error) {
      if (error instanceof HttpException) {
        response = new ThanhHoaResponse(error).toResponse();
      } else {
        throw error;
      }
    }

    const requestOrigin = context.request.headers.get('Origin');
    const allowOrigin = Array.isArray(corsOptions.origin)
      ? corsOptions.origin.includes(requestOrigin || '')
        ? requestOrigin
        : undefined
      : corsOptions.origin;

    // Set CORS headers
    response.headers.set('Access-Control-Allow-Origin', allowOrigin || '*');
    response.headers.set(
      'Access-Control-Allow-Methods',
      corsOptions.methods?.join(',') ||
        (defaultCORSOptions.methods ?? []).join(','),
    );
    response.headers.set(
      'Access-Control-Allow-Headers',
      corsOptions.allowedHeaders?.join(',') ||
        (defaultCORSOptions.allowedHeaders ?? []).join(','),
    );
    response.headers.set(
      'Access-Control-Max-Age',
      corsOptions.maxAge?.toString() || '86400',
    );

    if (corsOptions.credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    if (corsOptions.exposedHeaders) {
      response.headers.set(
        'Access-Control-Expose-Headers',
        corsOptions.exposedHeaders.join(','),
      );
    }

    // Add secure headers if enabled
    if (corsOptions.secureHeaders) {
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set(
        'Strict-Transport-Security',
        'max-age=63072000; includeSubDomains; preload',
      );
    }

    return response;
  };
};
