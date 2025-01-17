/**
 * Represents an HTTP exception.
 * @class HttpException
 * @extends {Error}
 * @description An exception that occurs during HTTP request processing.
 */
export class HttpException extends Error {
  /**
   * The HTTP status code associated with the exception.
   * @type {number}
   */
  status: number;

  /**
   * Additional data related to the exception (optional).
   * @type {any}
   */
  data?: any;

  /**
   * HTTP headers associated with the exception (optional).
   * @type {Record<string, string | number | string[]>}
   */
  headers?: Record<string, string | number | string[]>;

  /**
   * Creates a new HTTP exception instance.
   * @param {string} message - The exception message.
   * @param {number} status - The HTTP status code.
   * @param {any} [data] - Additional data related to the exception (optional).
   * @param {Record<string, string | number | string[]>} [headers] - HTTP headers associated with the exception (optional).
   */
  constructor(
    message: string,
    status: number = 500,
    data?: any,
    headers?: Record<string, string | number | string[]>,
  ) {
    super(message);
    Object.setPrototypeOf(this, HttpException.prototype);
    this.name = 'HttpException';
    this.status = status;
    this.data = data;
    this.headers = headers;
  }

  /**
   * Sets custom headers for the exception
   * @param headers - The headers to set
   */
  setHeaders(headers: Record<string, string | number | string[]>) {
    this.headers = { ...this.headers, ...headers };
    return this;
  }
}
