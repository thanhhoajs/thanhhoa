/**
 * Helmet middleware options.
 */
export interface IHelmetOptions {
  xssFilter?: boolean;
  noSniff?: boolean;
  frameguard?: 'DENY' | 'SAMEORIGIN';
  hsts?: { maxAge: number; includeSubDomains?: boolean; preload?: boolean };
  hidePoweredBy?: boolean;
  contentSecurityPolicy?: Record<string, string | string[]>;
}
