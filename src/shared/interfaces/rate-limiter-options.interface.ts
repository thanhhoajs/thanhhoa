export interface IRateLimiterOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipFailedRequests?: boolean;
  skipSuccessfulRequests?: boolean;
  redis?: {
    enabled: boolean;
    url?: string; // Redis connection URL
  };
}
