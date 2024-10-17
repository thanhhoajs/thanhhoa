import type {
  HttpMethod,
  IRequestContext,
  IRoute,
  Middleware,
  RouteHandler,
} from '@thanhhoajs/thanhhoa';
import { Logger } from '@thanhhoajs/logger';

/**
 * Represents the interface for a router.
 */
export class Router {
  private routes: IRoute[] = [];
  private globalMiddlewares: Middleware[] = [];
  protected logger = Logger.get('THANHHOA');

  constructor(private prefix: string = '') {}

  private addRoute(
    method: HttpMethod,
    path: string,
    middlewares: Middleware[],
    handler: RouteHandler,
  ): void {
    const fullPath = this.prefix + path;
    const paramNames: string[] = [];
    const pattern = new RegExp(
      '^' +
        fullPath.replace(/:([\w]+)(?=\/|$)/g, (_, name) => {
          paramNames.push(name);
          return '([^\\/]+)';
        }) +
        '$',
    );
    this.routes.push({ method, pattern, paramNames, middlewares, handler });
    this.logger.info(`Defined route [${method}] ${fullPath}`);
  }

  /**
   * Adds a global middleware.
   *
   * @param {Middleware} middleware - The middleware.
   * @returns {this} The current instance.
   */
  use(middleware: Middleware): this {
    this.globalMiddlewares.push(middleware);
    this.logger.info('Registered global middleware');
    return this;
  }

  /**
   * Adds a GET route.
   *
   * @param {string} path - The path.
   * @param {...(Middleware | RouteHandler)[]} handlers - The array of middlewares and route handlers.
   * @returns {this} The current instance.
   */
  get = this.routeMethod('GET');

  /**
   * Adds a POST route.
   *
   * @param {string} path - The path.
   * @param {...(Middleware | RouteHandler)[]} handlers - The array of middlewares and route handlers.
   * @returns {this} The current instance.
   */
  post = this.routeMethod('POST');

  /**
   * Adds a PUT route.
   *
   * @param {string} path - The path.
   * @param {...(Middleware | RouteHandler)[]} handlers - The array of middlewares and route handlers.
   * @returns {this} The current instance.
   */
  put = this.routeMethod('PUT');

  /**
   * Adds a PATCH route.
   *
   * @param {string} path - The path.
   * @param {...(Middleware | RouteHandler)[]} handlers - The array of middlewares and route handlers.
   * @returns {this} The current instance.
   */
  patch = this.routeMethod('PATCH');

  /**
   * Adds a DELETE route.
   *
   * @param {string} path - The path.
   * @param {...(Middleware | RouteHandler)[]} handlers - The array of middlewares and route handlers.
   * @returns {this} The current instance.
   */
  delete = this.routeMethod('DELETE');

  private routeMethod(method: HttpMethod) {
    return (path: string, ...handlers: (Middleware | RouteHandler)[]): this => {
      const middlewares = handlers.slice(0, -1) as Middleware[];
      const handler = handlers[handlers.length - 1] as RouteHandler;
      this.addRoute(method, path, middlewares, handler);
      return this;
    };
  }

  /**
   * Adds a route group.
   *
   * @param {string} prefix - The prefix.
   * @param {(router: IRouter) => void} callback - The callback.
   * @returns {this} The current instance.
   */
  group(prefix: string, callback: (router: Router) => void): this {
    const subRouter = new Router(this.prefix + prefix);
    callback(subRouter);
    this.routes.push(...subRouter.routes);
    this.globalMiddlewares.push(...subRouter.globalMiddlewares);
    return this;
  }

  /**
   * Handles the request.
   *
   * @param {IRequestContext} context - The request context.
   * @returns {Promise<Response | null>} The promise of the response.
   */
  async handle(context: IRequestContext): Promise<Response | null> {
    const { request } = context;
    const method = request.method as HttpMethod;
    const url = new URL(request.url);
    const path = url.pathname;

    this.logger.info(`Handling request [${method}] ${path}`);

    for (const route of this.routes) {
      if (route.method === method) {
        const match = path.match(route.pattern);
        if (match) {
          const params: Record<string, string> = {};
          route.paramNames.forEach((name, index) => {
            params[name] = match[index + 1];
          });
          context.params = params;

          const runMiddlewares = async (
            middlewares: Middleware[],
            index = 0,
          ): Promise<Response> => {
            if (index < middlewares.length) {
              const middleware = middlewares[index];
              return middleware(context, () =>
                runMiddlewares(middlewares, index + 1),
              );
            }
            return route.handler(context);
          };

          return runMiddlewares([
            ...this.globalMiddlewares,
            ...route.middlewares,
          ]);
        }
      }
    }

    return null;
  }
}
