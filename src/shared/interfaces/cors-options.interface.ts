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

  // Advanced Security Options
  secureHeaders?: boolean;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;

  // Additional Security Headers
  contentSecurityPolicy?: string | boolean;
  referrerPolicy?: string;
  xssProtection?: boolean;
  privateNetwork?: boolean;
  allowPrivateNetwork?: boolean;
}
