import {
  type IRequestContext,
  type INextFunction,
  type Middleware,
  ThanhHoaResponse,
  HttpException,
  type IHelmetOptions,
} from '@thanhhoajs/thanhhoa';

/**
 * Default Helmet options.
 */
const defaultHelmetOptions: IHelmetOptions = {
  xssFilter: true,
  noSniff: true,
  frameguard: 'DENY',
  hsts: { maxAge: 63072000, includeSubDomains: true, preload: true }, // 2 years
  hidePoweredBy: true,
  contentSecurityPolicy: {
    'default-src': ["'self'"],
  },
};

/**
 * Helmet middleware to set secure HTTP headers.
 *
 * @param {IHelmetOptions} [options=defaultHelmetOptions] - Configuration options for Helmet.
 * @returns {Middleware} A middleware function that applies Helmet headers to the response.
 *
 * @description
 * This middleware function allows you to configure secure HTTP headers such as X-XSS-Protection,
 *
 * @example
 * app.use(helmetMiddleware());
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

    // Prepare headers
    const headers = response.headers;

    // X-XSS-Protection
    helmetOptions.xssFilter && headers.set('X-XSS-Protection', '1; mode=block');

    // X-Content-Type-Options
    helmetOptions.noSniff && headers.set('X-Content-Type-Options', 'nosniff');

    // X-Frame-Options
    helmetOptions.frameguard &&
      headers.set('X-Frame-Options', helmetOptions.frameguard);

    // Strict-Transport-Security (HSTS)
    if (helmetOptions.hsts) {
      const { maxAge, includeSubDomains, preload } = helmetOptions.hsts;
      let hstsValue = `max-age=${maxAge}`;
      includeSubDomains && (hstsValue += '; includeSubDomains');
      preload && (hstsValue += '; preload');
      headers.set('Strict-Transport-Security', hstsValue);
    }

    // Hide X-Powered-By
    helmetOptions.hidePoweredBy && headers.delete('X-Powered-By');

    // Content-Security-Policy (CSP)
    if (helmetOptions.contentSecurityPolicy) {
      const cspDirectives = Object.entries(helmetOptions.contentSecurityPolicy)
        .map(
          ([key, value]) =>
            `${key} ${Array.isArray(value) ? value.join(' ') : value}`,
        )
        .join('; ');
      headers.set('Content-Security-Policy', cspDirectives);
    }

    return response;
  };
};
