import {
  type IRequestContext,
  type INextFunction,
  type Middleware,
  type IHelmetOptions,
} from '@thanhhoajs/thanhhoa';

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
