import type { Middleware } from '../shared/types';

interface HelmetOptions {
  contentSecurityPolicy?: string | boolean;
  crossOriginEmbedderPolicy?: boolean;
  crossOriginOpenerPolicy?: boolean;
  crossOriginResourcePolicy?: boolean;
  dnsPrefetchControl?: boolean;
  frameguard?: boolean | 'DENY' | 'SAMEORIGIN';
  hidePoweredBy?: boolean;
  hsts?:
    | boolean
    | { maxAge?: number; includeSubDomains?: boolean; preload?: boolean };
  ieNoOpen?: boolean;
  noSniff?: boolean;
  originAgentCluster?: boolean;
  permittedCrossDomainPolicies?: boolean;
  referrerPolicy?: boolean | string;
  xssFilter?: boolean;
}

/**
 * Helmet-style security headers middleware
 * @param options Configuration options
 */
export const helmet = (options: HelmetOptions = {}): Middleware => {
  return async (ctx, next) => {
    const response = await next();
    const headers = response.headers;

    // X-DNS-Prefetch-Control
    if (options.dnsPrefetchControl !== false) {
      headers.set('X-DNS-Prefetch-Control', 'off');
    }

    // X-Frame-Options
    if (options.frameguard !== false) {
      headers.set(
        'X-Frame-Options',
        typeof options.frameguard === 'string'
          ? options.frameguard
          : 'SAMEORIGIN',
      );
    }

    // Strict-Transport-Security
    if (options.hsts !== false) {
      const hstsopts = typeof options.hsts === 'object' ? options.hsts : {};
      const maxAge = hstsopts.maxAge ?? 15552000; // 180 days
      let header = `max-age=${maxAge}`;
      if (hstsopts.includeSubDomains) header += '; includeSubDomains';
      if (hstsopts.preload) header += '; preload';
      headers.set('Strict-Transport-Security', header);
    }

    // X-Download-Options
    if (options.ieNoOpen !== false) {
      headers.set('X-Download-Options', 'noopen');
    }

    // X-Content-Type-Options
    if (options.noSniff !== false) {
      headers.set('X-Content-Type-Options', 'nosniff');
    }

    // X-XSS-Protection
    if (options.xssFilter !== false) {
      headers.set('X-XSS-Protection', '0');
    }

    // Referrer-Policy
    if (options.referrerPolicy !== false) {
      headers.set(
        'Referrer-Policy',
        typeof options.referrerPolicy === 'string'
          ? options.referrerPolicy
          : 'no-referrer',
      );
    }

    // Content-Security-Policy
    if (options.contentSecurityPolicy) {
      headers.set(
        'Content-Security-Policy',
        typeof options.contentSecurityPolicy === 'string'
          ? options.contentSecurityPolicy
          : "default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests",
      );
    }

    // Remove X-Powered-By
    if (options.hidePoweredBy !== false) {
      headers.delete('X-Powered-By');
    }

    return response;
  };
};

interface CorsOptions {
  origin?:
    | string
    | string[]
    | ((origin: string) => boolean | string | string[]);
  methods?: string | string[];
  allowedHeaders?: string | string[];
  exposedHeaders?: string | string[];
  credentials?: boolean;
  maxAge?: number;
  optionsSuccessStatus?: number;
}

/**
 * CORS middleware
 * @param options Configuration options
 */
export const cors = (options: CorsOptions = {}): Middleware => {
  const defaults: CorsOptions = {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    optionsSuccessStatus: 204,
  };
  const opts = { ...defaults, ...options };

  return async (ctx, next) => {
    const requestOrigin = ctx.request.headers.get('Origin');

    // Handle Preflight logic if necessary or leave it to the core router handleOptions
    // Since existing core handles OPTIONS separately, this middleware mainly decorates responses
    // However, for proper CORS, we should probably handle OPTIONS here if we want full control
    // But typically middleware runs for the matched route.

    // Core's handleOptions is very basic.

    // We will apply headers to the response
    const response = await next();

    if (!requestOrigin) return response;

    // Access-Control-Allow-Origin
    let allowOrigin = '*';
    if (typeof opts.origin === 'function') {
      const result = opts.origin(requestOrigin);
      if (typeof result === 'string') allowOrigin = result;
      else if (result === true) allowOrigin = requestOrigin;
      else allowOrigin = '';
    } else if (Array.isArray(opts.origin)) {
      if (opts.origin.includes(requestOrigin)) allowOrigin = requestOrigin;
      else allowOrigin = '';
    } else if (opts.origin) {
      allowOrigin = opts.origin === '*' ? '*' : opts.origin;
    }

    if (allowOrigin) {
      response.headers.set('Access-Control-Allow-Origin', allowOrigin);
    }

    // Access-Control-Allow-Credentials
    if (opts.credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      if (allowOrigin === '*') {
        // If credentials is true, origin cannot be '*'
        response.headers.set('Access-Control-Allow-Origin', requestOrigin);
      }
    }

    // Access-Control-Max-Age
    if (opts.maxAge) {
      response.headers.set('Access-Control-Max-Age', opts.maxAge.toString());
    }

    // Access-Control-Allow-Methods
    if (opts.methods) {
      const methods = Array.isArray(opts.methods)
        ? opts.methods.join(',')
        : opts.methods;
      response.headers.set('Access-Control-Allow-Methods', methods);
    }

    // Access-Control-Allow-Headers
    if (opts.allowedHeaders) {
      const headers = Array.isArray(opts.allowedHeaders)
        ? opts.allowedHeaders.join(',')
        : opts.allowedHeaders;
      response.headers.set('Access-Control-Allow-Headers', headers);
    }

    // Access-Control-Expose-Headers
    if (opts.exposedHeaders) {
      const headers = Array.isArray(opts.exposedHeaders)
        ? opts.exposedHeaders.join(',')
        : opts.exposedHeaders;
      response.headers.set('Access-Control-Expose-Headers', headers);
    }

    return response;
  };
};
