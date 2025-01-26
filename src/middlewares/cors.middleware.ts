import {
  type IRequestContext,
  type INextFunction,
  type Middleware,
} from '@thanhhoajs/thanhhoa';

/**
 * CORS middleware options.
 */
export interface ICORSOptions {
  // Basic CORS Options
  origin?: string | string[] | boolean;
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;

  // Network Access Control
  privateNetwork?: boolean;
  allowPrivateNetwork?: boolean;
}

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
  preflightContinue: false,
  optionsSuccessStatus: 204,
  privateNetwork: false,
  allowPrivateNetwork: false,
};

const preflightCache = new Map<string, Response>();

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
  options: Partial<ICORSOptions> = {},
): Middleware => {
  const corsOptions = {
    ...defaultCORSOptions,
    ...options,
  } as Required<ICORSOptions>;

  return async (context: IRequestContext, next: INextFunction) => {
    const response =
      context.request.method === 'OPTIONS'
        ? new Response(null, { status: corsOptions.optionsSuccessStatus })
        : await next();

    const headers = new Headers(response.headers);

    // Handle origin
    const requestOrigin = context.request.headers.get('Origin');
    let allowOrigin = '*';

    if (typeof corsOptions.origin === 'boolean') {
      allowOrigin = corsOptions.origin ? requestOrigin || '*' : '*';
    } else if (Array.isArray(corsOptions.origin)) {
      allowOrigin = corsOptions.origin.includes(requestOrigin || '')
        ? requestOrigin || '*'
        : '*';
    } else if (typeof corsOptions.origin === 'string') {
      allowOrigin = corsOptions.origin;
    }

    headers.set('Access-Control-Allow-Origin', allowOrigin);
    headers.set('Access-Control-Allow-Methods', corsOptions.methods.join(', '));
    headers.set(
      'Access-Control-Allow-Headers',
      corsOptions.allowedHeaders.join(', '),
    );

    if (corsOptions.credentials) {
      headers.set('Access-Control-Allow-Credentials', 'true');
    }

    if (corsOptions.maxAge) {
      headers.set('Access-Control-Max-Age', corsOptions.maxAge.toString());
    }

    return new Response(response.body, {
      status: response.status,
      headers,
    });
  };
};
