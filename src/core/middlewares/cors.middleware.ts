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
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
  ],
  exposedHeaders: ['Content-Length', 'Content-Range', 'X-Content-Range'],
  credentials: false,
  maxAge: 86400,
  secureHeaders: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
  contentSecurityPolicy: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
  xssProtection: true,
  privateNetwork: false,
  allowPrivateNetwork: false,
};

/**
 * Enhanced CORS middleware to handle Cross-Origin Resource Sharing settings for HTTP requests.
 *
 * @param {ICORSOptions} [options=defaultCORSOptions] - Configuration options for CORS.
 * @returns {Middleware} A middleware function that applies CORS headers to the response.
 *
 * @description
 * This middleware provides comprehensive CORS and security headers configuration:
 * - Flexible origin configuration (string, array, or dynamic function)
 * - Customizable HTTP methods and headers
 * - Preflight request handling
 * - Security headers (CSP, HSTS, XSS Protection, etc.)
 * - Private network access control
 * - Detailed error handling
 *
 * @example
 * // Basic usage
 * app.use(corsMiddleware());
 *
 * // Custom configuration
 * app.use(corsMiddleware({
 *   origin: ['https://example.com', 'https://api.example.com'],
 *   credentials: true,
 *   contentSecurityPolicy: "default-src 'self'"
 * }));
 */
export const corsMiddleware = (
  options: ICORSOptions = defaultCORSOptions,
): Middleware => {
  const corsOptions = { ...defaultCORSOptions, ...options };

  return async (context: IRequestContext, next: INextFunction) => {
    let response: Response;

    try {
      // Handle preflight requests
      if (context.request.method === 'OPTIONS') {
        if (!corsOptions.preflightContinue) {
          response = new Response(null, {
            status: corsOptions.optionsSuccessStatus,
          });
        } else {
          response = await next();
        }
      } else {
        response = await next();
      }
    } catch (error) {
      if (error instanceof HttpException) {
        response = new ThanhHoaResponse(error).toResponse();
      } else {
        throw error;
      }
    }

    // Handle origin
    const requestOrigin = context.request.headers.get('Origin');
    let allowOrigin: string | null = '*';

    if (typeof corsOptions.origin === 'boolean') {
      allowOrigin = corsOptions.origin ? requestOrigin : null;
    } else if (Array.isArray(corsOptions.origin)) {
      allowOrigin = corsOptions.origin.includes(requestOrigin || '')
        ? requestOrigin
        : null;
    } else if (typeof corsOptions.origin === 'string') {
      allowOrigin = corsOptions.origin;
    }

    // Set basic CORS headers
    if (allowOrigin) {
      response.headers.set('Access-Control-Allow-Origin', allowOrigin);
    }

    // Set Vary header if origin is not *
    if (allowOrigin !== '*') {
      response.headers.append('Vary', 'Origin');
    }

    // Methods
    response.headers.set(
      'Access-Control-Allow-Methods',
      corsOptions.methods?.join(', ') || defaultCORSOptions.methods!.join(', '),
    );

    // Allowed Headers
    response.headers.set(
      'Access-Control-Allow-Headers',
      corsOptions.allowedHeaders?.join(', ') ||
        defaultCORSOptions.allowedHeaders!.join(', '),
    );

    // Exposed Headers
    if (corsOptions.exposedHeaders?.length) {
      response.headers.set(
        'Access-Control-Expose-Headers',
        corsOptions.exposedHeaders.join(', '),
      );
    }

    // Credentials
    if (corsOptions.credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    // Max Age
    if (corsOptions.maxAge) {
      response.headers.set(
        'Access-Control-Max-Age',
        corsOptions.maxAge.toString(),
      );
    }

    // Security Headers
    if (corsOptions.secureHeaders) {
      // Basic security headers
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set(
        'Strict-Transport-Security',
        'max-age=63072000; includeSubDomains; preload',
      );

      // Content Security Policy
      if (corsOptions.contentSecurityPolicy) {
        const cspValue =
          typeof corsOptions.contentSecurityPolicy === 'string'
            ? corsOptions.contentSecurityPolicy
            : "default-src 'self'; img-src 'self' data: https:; script-src 'self'";
        response.headers.set('Content-Security-Policy', cspValue);
      }

      // XSS Protection
      if (corsOptions.xssProtection) {
        response.headers.set('X-XSS-Protection', '1; mode=block');
      }

      // Referrer Policy
      if (corsOptions.referrerPolicy) {
        response.headers.set('Referrer-Policy', corsOptions.referrerPolicy);
      }
    }

    // Private Network Access
    if (corsOptions.privateNetwork) {
      response.headers.set('Access-Control-Request-Private-Network', 'true');
    }

    if (corsOptions.allowPrivateNetwork) {
      response.headers.set('Access-Control-Allow-Private-Network', 'true');
    }

    return response;
  };
};
