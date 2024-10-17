import type { Logger } from '@thanhhoajs/logger';
import type {
  HttpMethod,
  IRequestContext,
  IRoute,
  Middleware,
  RouteHandler,
} from '@thanhhoajs/thanhhoa';

/**
 * Represents the interface for a router.
 */
export interface IRouter {
  /**
   * The array of routes.
   */
  routes: IRoute[];

  /**
   * The array of global middlewares.
   */
  globalMiddlewares: Middleware[];

  /**
   * The logger.
   */
  logger: Logger;

  /**
   * Adds a route.
   *
   * @param {HttpMethod} method - The HTTP method.
   * @param {string} path - The path.
   * @param {Middleware[]} middlewares - The array of middlewares.
   * @param {RouteHandler} handler - The route handler.
   */
  addRoute(
    method: HttpMethod,
    path: string,
    middlewares: Middleware[],
    handler: RouteHandler,
  ): void;

  /**
   * Adds a global middleware.
   *
   * @param {Middleware} middleware - The middleware.
   * @returns {this} The current instance.
   */
  use(middleware: Middleware): this;

  /**
   * Adds a GET route.
   *
   * @param {string} path - The path.
   * @param {...(Middleware | RouteHandler)[]} handlers - The array of middlewares and route handlers.
   * @returns {this} The current instance.
   */
  get(path: string, ...handlers: (Middleware | RouteHandler)[]): this;

  /**
   * Adds a POST route.
   *
   * @param {string} path - The path.
   * @param {...(Middleware | RouteHandler)[]} handlers - The array of middlewares and route handlers.
   * @returns {this} The current instance.
   */
  post(path: string, ...handlers: (Middleware | RouteHandler)[]): this;

  /**
   * Adds a PUT route.
   *
   * @param {string} path - The path.
   * @param {...(Middleware | RouteHandler)[]} handlers - The array of middlewares and route handlers.
   * @returns {this} The current instance.
   */
  put(path: string, ...handlers: (Middleware | RouteHandler)[]): this;

  /**
   * Adds a PATCH route.
   *
   * @param {string} path - The path.
   * @param {...(Middleware | RouteHandler)[]} handlers - The array of middlewares and route handlers.
   * @returns {this} The current instance.
   */
  patch(path: string, ...handlers: (Middleware | RouteHandler)[]): this;

  /**
   * Adds a DELETE route.
   *
   * @param {string} path - The path.
   * @param {...(Middleware | RouteHandler)[]} handlers - The array of middlewares and route handlers.
   * @returns {this} The current instance.
   */
  delete(path: string, ...handlers: (Middleware | RouteHandler)[]): this;

  /**
   * Adds a route group.
   *
   * @param {string} prefix - The prefix.
   * @param {(router: IRouter) => void} callback - The callback.
   * @returns {this} The current instance.
   */
  group(prefix: string, callback: (router: IRouter) => void): this;

  /**
   * Handles the request.
   *
   * @param {IRequestContext} context - The request context.
   * @returns {Promise<Response | null>} The promise of the response.
   */
  handle(context: IRequestContext): Promise<Response | null>;
}
