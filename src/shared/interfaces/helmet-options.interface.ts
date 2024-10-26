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
}
