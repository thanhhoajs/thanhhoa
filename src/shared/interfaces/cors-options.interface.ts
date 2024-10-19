/**
 * CORS middleware options.
 */
export interface ICORSOptions {
  origin?: string | string[];
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
  secureHeaders?: boolean;
}
