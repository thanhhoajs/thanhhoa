/**
 * HttpException - Structured error class for ThanhHoaJS
 * Use this to throw HTTP errors with status codes and optional data
 *
 * @example
 * throw new HttpException('User not found', 404);
 * throw new HttpException('Validation failed', 400, { field: 'email' });
 */
export class HttpException extends Error {
  public readonly status: number;
  public readonly data?: Record<string, any>;

  constructor(
    message: string,
    status: number = 500,
    data?: Record<string, any>,
  ) {
    super(message);
    this.name = 'HttpException';
    this.status = status;
    this.data = data;

    // Maintains proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, HttpException);
    }
  }

  /**
   * Convert to JSON response
   */
  toJSON(): Record<string, any> {
    return {
      error: this.name,
      message: this.message,
      status: this.status,
      ...(this.data && { data: this.data }),
    };
  }

  /**
   * Convert to Response object
   */
  toResponse(): Response {
    return new Response(JSON.stringify(this.toJSON()), {
      status: this.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Common HTTP exception factories
 */
export const BadRequest = (
  message = 'Bad Request',
  data?: Record<string, any>,
) => new HttpException(message, 400, data);

export const Unauthorized = (
  message = 'Unauthorized',
  data?: Record<string, any>,
) => new HttpException(message, 401, data);

export const Forbidden = (message = 'Forbidden', data?: Record<string, any>) =>
  new HttpException(message, 403, data);

export const NotFound = (message = 'Not Found', data?: Record<string, any>) =>
  new HttpException(message, 404, data);

export const MethodNotAllowed = (
  message = 'Method Not Allowed',
  data?: Record<string, any>,
) => new HttpException(message, 405, data);

export const Conflict = (message = 'Conflict', data?: Record<string, any>) =>
  new HttpException(message, 409, data);

export const UnprocessableEntity = (
  message = 'Unprocessable Entity',
  data?: Record<string, any>,
) => new HttpException(message, 422, data);

export const TooManyRequests = (
  message = 'Too Many Requests',
  data?: Record<string, any>,
) => new HttpException(message, 429, data);

export const InternalServerError = (
  message = 'Internal Server Error',
  data?: Record<string, any>,
) => new HttpException(message, 500, data);

export const ServiceUnavailable = (
  message = 'Service Unavailable',
  data?: Record<string, any>,
) => new HttpException(message, 503, data);
