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
