/**
 * Base class for exception filters
 * @abstract
 */
export abstract class BaseExceptionFilter {
  /**
   * @param {any} logger - Optional logger instance
   */
  constructor(protected logger?: any) {}

  /**
   * Abstract method to handle errors
   * @abstract
   * @param {Error} error - The error to handle
   * @param {any} context - The context in which the error occurred
   * @returns {Response} The response to send back
   */
  abstract catch(error: Error, context: any): Response;
}

import {
  HttpException,
  IRequestContext,
  ThanhHoaResponse,
} from '@thanhhoajs/thanhhoa';

/**
 * Implementation of exception filter to handle HTTP exceptions
 * @class ExceptionFilter
 */
export class ExceptionFilter {
  /** @type {any} Logger instance */
  logger: any;

  /**
   * Catches and handles exceptions
   * @param {Error} error - The error to handle
   * @param {IRequestContext} context - The request context
   * @returns {Response} The formatted response
   */
  catch(error: Error, context: IRequestContext): Response {
    if (this.logger) {
      this.logger.error({
        message: error.message,
        stack: error.stack,
        context,
      });
    }

    if (error instanceof HttpException) {
      return new ThanhHoaResponse(error).toResponse();
    }

    // Log unexpected errors
    console.error(error);
    return new ThanhHoaResponse({
      status: 500,
      message: 'Internal Server Error',
    }).toResponse();
  }
}
