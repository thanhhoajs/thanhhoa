import type {
  HttpMethod,
  INextFunction,
  IRequestContext,
  Middleware,
  RouteHandler,
} from '@thanhhoajs/thanhhoa';
import { createRouter } from 'radix3';
import { Logger } from '@thanhhoajs/logger';

export class Router {
  private radixRouter = createRouter();
  private globalMiddlewares: Middleware[] = [];
  protected logger = Logger.get('THANHHOA');

  constructor(protected prefix: string = '') {}

  /**
   * Adds a global middleware to the router
   * @param middleware The middleware function to be executed for all routes
   * @returns The router instance for chaining
   */
  use(middleware: Middleware): this {
    this.globalMiddlewares.push(middleware);
    return this;
  }

  addRoute(
    method: HttpMethod,
    path: string,
    handler: RouteHandler,
    middlewares: Middleware[] = [],
  ) {
    const fullPath = `${method}:${this.prefix}${path}`;
    this.radixRouter.insert(fullPath, { handler, middlewares });
    this.logger.info(`Defined route ${fullPath}`);
  }

  /**
   * Registers a GET route handler
   * @param path The URL path pattern
   * @param handlers Array of middleware functions and a final route handler
   * @returns The router instance for chaining
   */
  get = this.routeMethod('GET');

  /**
   * Registers a POST route handler
   * @param path The URL path pattern
   * @param handlers Array of middleware functions and a final route handler
   * @returns The router instance for chaining
   */
  post = this.routeMethod('POST');

  /**
   * Registers a PUT route handler
   * @param path The URL path pattern
   * @param handlers Array of middleware functions and a final route handler
   * @returns The router instance for chaining
   */
  put = this.routeMethod('PUT');

  /**
   * Registers a PATCH route handler
   * @param path The URL path pattern
   * @param handlers Array of middleware functions and a final route handler
   * @returns The router instance for chaining
   */
  patch = this.routeMethod('PATCH');

  /**
   * Registers a DELETE route handler
   * @param path The URL path pattern
   * @param handlers Array of middleware functions and a final route handler
   * @returns The router instance for chaining
   */
  delete = this.routeMethod('DELETE');

  private routeMethod(method: HttpMethod) {
    return (path: string, ...handlers: (Middleware | RouteHandler)[]) => {
      const middlewares = handlers.slice(0, -1) as Middleware[];
      const handler = handlers[handlers.length - 1] as RouteHandler;
      this.addRoute(method, path, handler, middlewares);
      return this;
    };
  }

  /**
   * Gets the prefix string used for all routes in this router
   * @returns The router's prefix string
   */
  getPrefix(): string {
    return this.prefix;
  }

  async handle(context: IRequestContext): Promise<Response> {
    const { request } = context;
    const method = request.method as HttpMethod;
    const url = new URL(request.url);
    const path = url.pathname;

    const route = this.radixRouter.lookup(`${method}:${path}`);
    if (route) {
      context.params = route.params || {};
      const middlewares = [...this.globalMiddlewares, ...route.middlewares];
      return compose(middlewares)(context, () => route.handler(context));
    }

    return new Response('Not Found', { status: 404 });
  }
}

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
