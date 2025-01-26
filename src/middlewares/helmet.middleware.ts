import {
  type IRequestContext,
  type INextFunction,
  type Middleware,
} from '@thanhhoajs/thanhhoa';

/**
 * Helmet middleware options.
 */
export interface IHelmetOptions {
  // Basic Security Headers
  xssFilter?: boolean;
  noSniff?: boolean;
  frameguard?: 'DENY' | 'SAMEORIGIN' | false;
  hidePoweredBy?: boolean;

  // Content Security Policy
  contentSecurityPolicy?:
    | {
        [directive: string]: string[] | string;
      }
    | false;

  // HSTS Options
  hsts?:
    | {
        maxAge: number;
        includeSubDomains?: boolean;
        preload?: boolean;
      }
    | false;

  // Advanced Security Headers
  referrerPolicy?:
    | 'no-referrer'
    | 'no-referrer-when-downgrade'
    | 'origin'
    | 'origin-when-cross-origin'
    | 'same-origin'
    | 'strict-origin'
    | 'strict-origin-when-cross-origin'
    | 'unsafe-url'
    | false;

  expectCt?:
    | {
        enforce?: boolean;
        maxAge?: number;
        reportUri?: string;
      }
    | false;

  permissionsPolicy?:
    | {
        [feature: string]: string[] | string;
      }
    | false;

  crossOriginEmbedderPolicy?: 'require-corp' | 'credentialless' | false;
  crossOriginOpenerPolicy?:
    | 'same-origin'
    | 'same-origin-allow-popups'
    | 'unsafe-none'
    | false;
  crossOriginResourcePolicy?:
    | 'same-origin'
    | 'same-site'
    | 'cross-origin'
    | false;

  // Report Only Headers
  contentSecurityPolicyReportOnly?:
    | {
        [directive: string]: string[] | string | undefined;
        'report-uri'?: string[];
      }
    | false;

  // Cache Control
  cacheControl?:
    | {
        noCache?: boolean;
        noStore?: boolean;
        mustRevalidate?: boolean;
        maxAge?: number;
      }
    | false;

  // Clear Site Data
  clearSiteData?:
    | {
        cache?: boolean;
        cookies?: boolean;
        storage?: boolean;
        executionContexts?: boolean;
      }
    | false;

  // Network Access Headers
  privateNetwork?: boolean;
  allowPrivateNetwork?: boolean;

  // Additional Security Settings
  secureHeaders?: boolean; // Enable/disable all basic security headers
  xssProtection?: boolean | string; // Can be true/'1; mode=block'
  customSecurityHeaders?: {
    [key: string]: string;
  };
}

const defaultHelmetOptions: IHelmetOptions = {
  contentSecurityPolicy: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'"],
    'style-src': ["'self'", "'unsafe-inline'"],
  },
  hsts: {
    maxAge: 63072000, // 2 years
    includeSubDomains: true,
    preload: true,
  },
  frameguard: 'DENY',
  noSniff: true,
  xssFilter: true,
};

export const helmetMiddleware = (
  options: IHelmetOptions = defaultHelmetOptions,
): Middleware => {
  const helmetOptions = { ...defaultHelmetOptions, ...options };

  return async (context: IRequestContext, next: INextFunction) => {
    const response = await next();

    const headers = response.headers;

    // Content Security Policy
    if (helmetOptions.contentSecurityPolicy) {
      const csp = Object.entries(helmetOptions.contentSecurityPolicy)
        .map(
          ([key, value]) =>
            `${key} ${Array.isArray(value) ? value.join(' ') : value}`,
        )
        .join('; ');
      headers.set('Content-Security-Policy', csp);
    }

    // HSTS
    if (helmetOptions.hsts) {
      const { maxAge, includeSubDomains, preload } = helmetOptions.hsts;
      let hstsValue = `max-age=${maxAge}`;
      if (includeSubDomains) hstsValue += '; includeSubDomains';
      if (preload) hstsValue += '; preload';
      headers.set('Strict-Transport-Security', hstsValue);
    }

    // X-Frame-Options
    if (helmetOptions.frameguard) {
      headers.set('X-Frame-Options', helmetOptions.frameguard);
    }

    // X-Content-Type-Options
    if (helmetOptions.noSniff) {
      headers.set('X-Content-Type-Options', 'nosniff');
    }

    // X-XSS-Protection
    if (helmetOptions.xssFilter) {
      headers.set('X-XSS-Protection', '1; mode=block');
    }

    return response;
  };
};
