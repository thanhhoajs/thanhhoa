import type { INextFunction, IRequestContext } from '@thanhhoajs/thanhhoa';

/**
 * Represents an HTTP method.
 */
export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS';

/**
 * Represents a route handler function.
 */
export type RouteHandler = (
  context: IRequestContext,
) => Response | Promise<Response>;

/**
 * Represents a middleware function.
 */
export type Middleware = (
  context: IRequestContext,
  next: INextFunction,
) => Promise<Response>;
