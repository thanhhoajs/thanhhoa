import type {
  HttpMethod,
  Middleware,
  RouteHandler,
} from '@thanhhoajs/thanhhoa';

/**
 * Represents a route configuration.
 * @interface IRoute
 * @description Defines a route with its HTTP method, URL pattern, parameters, middlewares, and handler.
 */
export interface IRoute {
  /**
   * The HTTP method of the route (e.g. GET, POST, PUT, DELETE).
   * @type {HttpMethod}
   */
  method: HttpMethod;

  /**
   * The regular expression pattern that matches the route's URL.
   * @type {RegExp}
   */
  pattern: RegExp;

  /**
   * The names of the parameters extracted from the URL pattern.
   * @type {string[]}
   */
  paramNames: string[];

  /**
   * An array of middleware functions that will be executed before the route handler.
   * @type {Middleware[]}
   */
  middlewares: Middleware[];

  /**
   * The route handler function that will be executed after all middlewares.
   * @type {RouteHandler}
   */
  handler: RouteHandler;
}
