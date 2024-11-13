import {
  type IRequestContext,
  type INextFunction,
  type Middleware,
  ThanhHoaResponse,
  HttpException,
  type IHelmetOptions,
} from '@thanhhoajs/thanhhoa';

const defaultHelmetOptions: IHelmetOptions = {
  xssFilter: true,
  noSniff: true,
  frameguard: 'DENY',
  hidePoweredBy: true,

  hsts: {
    maxAge: 63072000,
    includeSubDomains: true,
    preload: true,
  },

  contentSecurityPolicy: {
    'default-src': ["'self'"],
    'base-uri': ["'self'"],
    'font-src': ["'self'", 'https:', 'data:'],
    'form-action': ["'self'"],
    'frame-ancestors': ["'self'"],
    'img-src': ["'self'", 'data:', 'https:'],
    'object-src': ["'none'"],
    'script-src': ["'self'"],
    'script-src-attr': ["'none'"],
    'style-src': ["'self'", 'https:', "'unsafe-inline'"],
    'upgrade-insecure-requests': [],
  },

  referrerPolicy: 'strict-origin-when-cross-origin',

  permissionsPolicy: {
    accelerometer: '()',
    'ambient-light-sensor': '()',
    autoplay: '()',
    battery: '()',
    camera: '()',
    'display-capture': '()',
    'document-domain': '()',
    'encrypted-media': '()',
    fullscreen: '()',
    geolocation: '()',
    gyroscope: '()',
    magnetometer: '()',
    microphone: '()',
    midi: '()',
    payment: '()',
    'picture-in-picture': '()',
    'publickey-credentials-get': '()',
    'screen-wake-lock': '()',
    usb: '()',
    'web-share': '()',
    'xr-spatial-tracking': '()',
  },

  crossOriginEmbedderPolicy: 'require-corp',
  crossOriginOpenerPolicy: 'same-origin',
  crossOriginResourcePolicy: 'same-origin',

  expectCt: {
    enforce: true,
    maxAge: 86400,
  },

  cacheControl: {
    noCache: true,
    noStore: true,
    mustRevalidate: true,
  },
};

/**
 * Enhanced Helmet middleware for comprehensive HTTP security headers.
 *
 * @param {IHelmetOptions} [options=defaultHelmetOptions] - Configuration options for Helmet.
 * @returns {Middleware} A middleware function that applies security headers to the response.
 *
 * @description
 * This middleware provides comprehensive security headers configuration:
 * - XSS Protection
 * - Content-Type sniffing prevention
 * - Frame protection
 * - Strict Transport Security
 * - Content Security Policy
 * - Permissions Policy
 * - Cross-Origin policies
 * - Cache control
 * - Clear site data
 *
 * @example
 * // Basic usage
 * app.use(helmetMiddleware());
 *
 * // Custom configuration
 * app.use(helmetMiddleware({
 *   contentSecurityPolicy: {
 *     'default-src': ["'self'"],
 *     'script-src': ["'self'", "'unsafe-inline'"],
 *   },
 *   referrerPolicy: 'strict-origin-when-cross-origin',
 * }));
 */
export const helmetMiddleware = (
  options: IHelmetOptions = defaultHelmetOptions,
): Middleware => {
  const helmetOptions = { ...defaultHelmetOptions, ...options };

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

    const headers = response.headers;

    // Basic Security Headers
    if (helmetOptions.xssFilter) {
      headers.set('X-XSS-Protection', '1; mode=block');
    }

    if (helmetOptions.noSniff) {
      headers.set('X-Content-Type-Options', 'nosniff');
    }

    if (helmetOptions.frameguard) {
      headers.set('X-Frame-Options', helmetOptions.frameguard);
    }

    if (helmetOptions.hidePoweredBy) {
      headers.delete('X-Powered-By');
      headers.delete('Server');
    }

    // HSTS
    if (helmetOptions.hsts) {
      const { maxAge, includeSubDomains, preload } = helmetOptions.hsts;
      let hstsValue = `max-age=${maxAge}`;
      if (includeSubDomains) hstsValue += '; includeSubDomains';
      if (preload) hstsValue += '; preload';
      headers.set('Strict-Transport-Security', hstsValue);
    }

    const formatDirectives = (directives: Record<string, string | string[]>) =>
      Object.entries(directives)
        .map(
          ([key, value]) =>
            `${key} ${Array.isArray(value) ? value.join(' ') : value}`,
        )
        .join('; ');

    // Content Security Policy
    if (helmetOptions.contentSecurityPolicy) {
      headers.set(
        'Content-Security-Policy',
        formatDirectives(helmetOptions.contentSecurityPolicy),
      );
    }

    // CSP Report Only
    if (helmetOptions.contentSecurityPolicyReportOnly) {
      const cspDirectives = Object.entries(
        helmetOptions.contentSecurityPolicyReportOnly,
      )
        .map(([key, value]) => {
          if (Array.isArray(value)) {
            return `${key} ${value.join(' ')}`;
          }
          return `${key} ${value}`;
        })
        .join('; ');
      headers.set('Content-Security-Policy-Report-Only', cspDirectives);
    }

    // Referrer Policy
    if (helmetOptions.referrerPolicy) {
      headers.set('Referrer-Policy', helmetOptions.referrerPolicy);
    }

    // Permissions Policy
    if (helmetOptions.permissionsPolicy) {
      headers.set(
        'Permissions-Policy',
        formatDirectives(helmetOptions.permissionsPolicy),
      );
    }

    // Cross-Origin Policies
    if (helmetOptions.crossOriginEmbedderPolicy) {
      headers.set(
        'Cross-Origin-Embedder-Policy',
        helmetOptions.crossOriginEmbedderPolicy,
      );
    }

    if (helmetOptions.crossOriginOpenerPolicy) {
      headers.set(
        'Cross-Origin-Opener-Policy',
        helmetOptions.crossOriginOpenerPolicy,
      );
    }

    if (helmetOptions.crossOriginResourcePolicy) {
      headers.set(
        'Cross-Origin-Resource-Policy',
        helmetOptions.crossOriginResourcePolicy,
      );
    }

    // Expect-CT
    if (helmetOptions.expectCt) {
      const { enforce, maxAge, reportUri } = helmetOptions.expectCt;
      let expectCtValue = `max-age=${maxAge ?? 86400}`;
      if (enforce) expectCtValue += ', enforce';
      if (reportUri) expectCtValue += `, report-uri="${reportUri}"`;
      headers.set('Expect-CT', expectCtValue);
    }

    // Cache Control
    if (helmetOptions.cacheControl) {
      const { noCache, noStore, mustRevalidate, maxAge } =
        helmetOptions.cacheControl;
      let cacheControl = [];
      if (noCache) cacheControl.push('no-cache');
      if (noStore) cacheControl.push('no-store');
      if (mustRevalidate) cacheControl.push('must-revalidate');
      if (maxAge !== undefined) cacheControl.push(`max-age=${maxAge}`);
      if (cacheControl.length > 0) {
        headers.set('Cache-Control', cacheControl.join(', '));
      }
    }

    // Clear Site Data
    if (helmetOptions.clearSiteData) {
      const clearSiteDataValues = [];
      if (helmetOptions.clearSiteData.cache)
        clearSiteDataValues.push('"cache"');
      if (helmetOptions.clearSiteData.cookies)
        clearSiteDataValues.push('"cookies"');
      if (helmetOptions.clearSiteData.storage)
        clearSiteDataValues.push('"storage"');
      if (helmetOptions.clearSiteData.executionContexts)
        clearSiteDataValues.push('"executionContexts"');
      if (clearSiteDataValues.length > 0) {
        headers.set('Clear-Site-Data', clearSiteDataValues.join(', '));
      }
    }

    return response;
  };
};
