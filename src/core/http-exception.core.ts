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
   * Creates a new HTTP exception instance.
   * @param {string} message - The exception message.
   * @param {number} status - The HTTP status code.
   * @param {any} [data] - Additional data related to the exception (optional).
   */
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}
