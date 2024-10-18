import type { INextFunction, IRequestContext } from '@thanhhoajs/thanhhoa';

/**
 * Represents an HTTP method.
 * @typedef {('GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE')} HttpMethod
 * @description Supported HTTP methods.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Represents a route handler function.
 * @typedef {function(context: IRequestContext): Response | Promise<Response>} RouteHandler
 * @description Handles incoming requests and returns a response or a promise of a response.
 * @param {IRequestContext} context - The request context.
 * @returns {Response | Promise<Response>} The response or a promise of a response.
 */
export type RouteHandler = (
  context: IRequestContext,
) => Response | Promise<Response>;

/**
 * Represents a middleware function.
 * @typedef {function(context: IRequestContext, next: function(): Promise<Response>): Promise<Response>} Middleware
 * @description Intercepts incoming requests and returns a promise of a response.
 * @param {IRequestContext} context - The request context.
 * @param {function(): Promise<Response>} next - The next middleware function in the chain.
 * @returns {Promise<Response>} A promise of a response.
 */
export type Middleware = (
  context: IRequestContext,
  next: INextFunction,
) => Promise<Response>;
