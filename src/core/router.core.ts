import {
  HttpMethod,
  INextFunction,
  IRequestContext,
  Middleware,
  RouteHandler,
  container,
  CONTROLLER_METADATA_KEY,
  ROUTE_METADATA_KEY,
  INJECT_METADATA_KEY,
} from '@thanhhoajs/thanhhoa';
import { createRouter } from 'radix3';
import { Logger } from '@thanhhoajs/logger';

/**
 * Router class for handling HTTP routing with middleware support
 * @class Router
 */
export class Router {
  private radixRouter = createRouter();
  private globalMiddlewares: Middleware[] = [];
  protected logger = Logger.get('THANHHOA');

  /**
   * Creates a new Router instance
   * @param {string} prefix - Optional prefix for all routes
   */
  constructor(protected prefix: string = '') {}

  /**
   * Normalizes a path by handling trailing slashes
   * @private
   * @param {string} path - The path to normalize
   * @returns {string} Normalized path
   */
  private normalizePath(path: string): string {
    if (path === '/') return path;
    return path.endsWith('/') ? path.slice(0, -1) : path;
  }

  /**
   * Adds a global middleware to the router
   * @param {Middleware} middleware - The middleware to add
   * @returns {this} The router instance for chaining
   */
  use(middleware: Middleware): this {
    this.globalMiddlewares.push(middleware);
    return this;
  }

  /**
   * Registers a GET route
   * @param {string} path - Route path
   * @param {RouteHandler} handler - Route handler
   * @param {Middleware[]} middlewares - Optional route-specific middlewares
   */
  get(path: string, handler: RouteHandler, middlewares: Middleware[] = []) {
    this.addRoute('GET', path, handler, middlewares);
    return this;
  }

  /**
   * Registers a POST route
   * @param {string} path - Route path
   * @param {RouteHandler} handler - Route handler
   * @param {Middleware[]} middlewares - Optional route-specific middlewares
   */
  post(path: string, handler: RouteHandler, middlewares: Middleware[] = []) {
    this.addRoute('POST', path, handler, middlewares);
    return this;
  }

  /**
   * Registers a PUT route
   * @param {string} path - Route path
   * @param {RouteHandler} handler - Route handler
   * @param {Middleware[]} middlewares - Optional route-specific middlewares
   */
  put(path: string, handler: RouteHandler, middlewares: Middleware[] = []) {
    this.addRoute('PUT', path, handler, middlewares);
    return this;
  }

  /**
   * Registers a PATCH route
   * @param {string} path - Route path
   * @param {RouteHandler} handler - Route handler
   * @param {Middleware[]} middlewares - Optional route-specific middlewares
   */
  patch(path: string, handler: RouteHandler, middlewares: Middleware[] = []) {
    this.addRoute('PATCH', path, handler, middlewares);
    return this;
  }

  /**
   * Registers a DELETE route
   * @param {string} path - Route path
   * @param {RouteHandler} handler - Route handler
   * @param {Middleware[]} middlewares - Optional route-specific middlewares
   */
  delete(path: string, handler: RouteHandler, middlewares: Middleware[] = []) {
    this.addRoute('DELETE', path, handler, middlewares);
    return this;
  }

  /**
   * Internal method to add a route
   * @protected
   * @param {HttpMethod} method - HTTP method
   * @param {string} path - Route path
   * @param {RouteHandler} handler - Route handler
   * @param {Middleware[]} middlewares - Optional middlewares
   */
  protected addRoute(
    method: HttpMethod,
    path: string,
    handler: RouteHandler,
    middlewares: Middleware[] = [],
  ) {
    // Normalize the path by ensuring it starts with / and removing trailing /
    const normalizedPath = path ? `/${path.replace(/^\/+/, '')}` : '/';
    const fullPath = `${method}:${this.normalizePath(this.prefix)}${this.normalizePath(normalizedPath)}`;
    this.radixRouter.insert(fullPath, { handler, middlewares });
    this.logger.info(`Defined route ${fullPath}`);
  }

  /**
   * Gets the prefix string used for all routes in this router
   * @returns {string} The router prefix
   */
  getPrefix(): string {
    return this.prefix;
  }

  /**
   * Register a controller with its routes
   * @param {any} controller - Controller class to register
   */
  registerController(controller: any) {
    // Get constructor injections
    const constructorParams =
      Reflect.getMetadata(INJECT_METADATA_KEY, controller) || [];

    // Get dependencies for constructor injection
    const dependencies = constructorParams.map((token: string) => {
      if (!token) return undefined;
      const provider = container.resolve(token);
      if (!provider) {
        throw new Error(
          `No provider found for ${token}! Make sure it is provided in the module.`,
        );
      }
      return provider;
    });

    // Create controller instance with injected dependencies
    const instance = new controller(...dependencies);
    const controllerPath =
      Reflect.getMetadata(CONTROLLER_METADATA_KEY, controller) || '';

    // Get all methods except constructor
    const methods = Object.getOwnPropertyNames(controller.prototype).filter(
      (name) => name !== 'constructor',
    );

    // Register routes
    for (const method of methods) {
      const routeMetadata = Reflect.getMetadata(
        ROUTE_METADATA_KEY,
        controller.prototype,
        method,
      );
      if (routeMetadata) {
        const { path: routePath, method: httpMethod } = routeMetadata;
        const fullPath = `${controllerPath}${routePath}`;

        const handler = instance[method].bind(instance);
        this.addRoute(httpMethod, fullPath, handler);
      }
    }
  }

  /**
   * Handle incoming requests
   * @param {IRequestContext} context - Request context
   * @returns {Promise<Response>} Response promise
   */
  async handle(context: IRequestContext): Promise<Response> {
    const { request } = context;
    const method = request.method as HttpMethod;
    const url = new URL(request.url);
    const normalizedPath = this.normalizePath(url.pathname);

    const route = this.radixRouter.lookup(`${method}:${normalizedPath}`);
    if (route) {
      context.params = route.params || {};
      const middlewares = [...this.globalMiddlewares, ...route.middlewares];
      return compose(middlewares)(context, () => route.handler(context));
    }

    return new Response('Not Found', { status: 404 });
  }
}

/**
 * Composes multiple middleware functions into a single middleware
 * @param {Middleware[]} middlewares - Array of middleware functions
 * @returns {Function} Composed middleware function
 */
const compose = (middlewares: Middleware[]) => {
  return (context: IRequestContext, next: INextFunction) => {
    const dispatch = (index: number): Promise<Response> => {
      if (index >= middlewares.length) return next();
      const middleware = middlewares[index];
      return middleware(context, () => dispatch(index + 1));
    };
    return dispatch(0);
  };
};
