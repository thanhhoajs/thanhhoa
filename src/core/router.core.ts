import {
  HttpMethod,
  INextFunction,
  IRequestContext,
  Middleware,
  RouteHandler,
} from '@thanhhoajs/thanhhoa';
import { createRouter } from 'radix3';
import { Logger } from '@thanhhoajs/logger';

// Pre-compiled handler type for maximum performance
type CompiledHandler = (ctx: IRequestContext) => Response | Promise<Response>;

// Route definition for storage and merging
interface RouteDefinition {
  method: HttpMethod;
  path: string;
  handler: RouteHandler;
  middlewares: Middleware[];
}

/**
 * Compile middleware chain at registration time (not runtime)
 * This eliminates runtime composition overhead
 */
const compileMiddleware = (
  middlewares: Middleware[],
  handler: RouteHandler,
): CompiledHandler => {
  // Fast path: no middleware
  if (middlewares.length === 0) {
    return handler;
  }

  // Single middleware optimization
  if (middlewares.length === 1) {
    const mw = middlewares[0];
    return (ctx) => mw(ctx, () => Promise.resolve(handler(ctx)));
  }

  // Multiple middlewares - pre-compile the chain
  return (ctx) => {
    let index = 0;
    const next = (): Promise<Response> => {
      if (index >= middlewares.length) {
        return Promise.resolve(handler(ctx));
      }
      const mw = middlewares[index++];
      return Promise.resolve(mw(ctx, next));
    };
    return next();
  };
};

/**
 * High-performance Router class for HTTP routing
 *
 * Features:
 * - Pre-compiled middleware chains
 * - Route grouping with prefix
 * - Sub-router mounting
 * - Group-specific middleware
 */
export class Router {
  // Store pre-compiled handlers for instant invocation
  private radixRouter = createRouter<{
    handler: CompiledHandler;
  }>();

  // Store route definitions for sub-router merging
  private routes: RouteDefinition[] = [];
  private globalMiddlewares: Middleware[] = [];
  protected logger = Logger.get('THANHHOA');
  private isProductionMode = process.env.NODE_ENV === 'production';

  constructor(protected prefix: string = '') {}

  /**
   * Inline path normalization - zero function call overhead
   */
  private normalizePath(path: string): string {
    if (path === '/') return '/';
    const len = path.length;
    return path.charCodeAt(len - 1) === 47 /* '/' */ ? path.slice(0, -1) : path;
  }

  /**
   * Adds a global middleware
   */
  use(middleware: Middleware | Router): this {
    if (middleware instanceof Router) {
      return this.mount('', middleware);
    }
    this.globalMiddlewares.push(middleware);
    return this;
  }

  /**
   * GET route
   */
  get(
    path: string,
    handler: RouteHandler,
    middlewares: Middleware[] = [],
  ): this {
    return this.addRoute('GET', path, handler, middlewares);
  }

  /**
   * POST route
   */
  post(
    path: string,
    handler: RouteHandler,
    middlewares: Middleware[] = [],
  ): this {
    return this.addRoute('POST', path, handler, middlewares);
  }

  /**
   * PUT route
   */
  put(
    path: string,
    handler: RouteHandler,
    middlewares: Middleware[] = [],
  ): this {
    return this.addRoute('PUT', path, handler, middlewares);
  }

  /**
   * PATCH route
   */
  patch(
    path: string,
    handler: RouteHandler,
    middlewares: Middleware[] = [],
  ): this {
    return this.addRoute('PATCH', path, handler, middlewares);
  }

  /**
   * DELETE route
   */
  delete(
    path: string,
    handler: RouteHandler,
    middlewares: Middleware[] = [],
  ): this {
    return this.addRoute('DELETE', path, handler, middlewares);
  }

  /**
   * HEAD route
   */
  head(
    path: string,
    handler: RouteHandler,
    middlewares: Middleware[] = [],
  ): this {
    return this.addRoute('HEAD', path, handler, middlewares);
  }

  /**
   * OPTIONS route
   */
  options(
    path: string,
    handler: RouteHandler,
    middlewares: Middleware[] = [],
  ): this {
    return this.addRoute('OPTIONS', path, handler, middlewares);
  }

  /**
   * Register a route with all HTTP methods
   */
  all(
    path: string,
    handler: RouteHandler,
    middlewares: Middleware[] = [],
  ): this {
    const methods: HttpMethod[] = [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'HEAD',
      'OPTIONS',
    ];
    for (let i = 0; i < methods.length; i++) {
      this.addRoute(methods[i], path, handler, middlewares);
    }
    return this;
  }

  /**
   * Create a route group with shared prefix and optional middleware
   *
   * @example
   * app.group('/users', (router) => {
   *   router.get('/', getAllUsers);       // GET /users
   *   router.get('/:id', getUser);        // GET /users/:id
   *   router.post('/', createUser);       // POST /users
   * });
   *
   * @example with middleware
   * app.group('/admin', (router) => {
   *   router.use(authMiddleware);
   *   router.get('/dashboard', getDashboard);
   * });
   */
  group(
    prefix: string,
    configure: (router: Router) => void,
    middlewares: Middleware[] = [],
  ): this {
    const groupPrefix = this.prefix + this.normalizePath(prefix);
    const subRouter = new Router(groupPrefix);

    // Inherit parent global middlewares + group-specific middlewares
    subRouter.globalMiddlewares = [...this.globalMiddlewares, ...middlewares];

    // Configure the sub-router (may include nested groups)
    configure(subRouter);

    // Merge all routes from sub-router (including nested) into this router
    for (const route of subRouter.routes) {
      // Store route definition
      this.routes.push(route);

      // Register to radix router
      this.registerRoute(
        route.method,
        route.path,
        route.handler,
        route.middlewares,
      );
    }

    return this;
  }

  /**
   * Mount a sub-router at a specific prefix
   *
   * @example
   * const userRouter = new Router();
   * userRouter.get('/', getAllUsers);
   * userRouter.get('/:id', getUser);
   *
   * app.mount('/users', userRouter);
   * // or
   * app.mount('/api/v1', apiRouter);
   */
  mount(prefix: string, router: Router): this {
    const mountPrefix = this.prefix + this.normalizePath(prefix);

    // Re-register all routes from the sub-router with new prefix
    for (const route of router.routes) {
      const fullPath =
        mountPrefix +
        (route.path === '/' ? '' : this.normalizePath(route.path));
      const allMiddlewares = [
        ...this.globalMiddlewares,
        ...router.globalMiddlewares,
        ...route.middlewares,
      ];

      // Store with new path
      this.routes.push({
        method: route.method,
        path: fullPath || '/',
        handler: route.handler,
        middlewares: allMiddlewares,
      });

      this.registerRoute(
        route.method,
        fullPath || '/',
        route.handler,
        allMiddlewares,
      );
    }

    if (!this.isProductionMode) {
      this.logger.info(`Mounted router at ${mountPrefix}`);
    }

    return this;
  }

  /**
   * Internal method to add a route with pre-compiled handler
   * Middleware is compiled at registration time for zero runtime overhead
   */
  protected addRoute(
    method: HttpMethod,
    path: string,
    handler: RouteHandler,
    middlewares: Middleware[] = [],
  ): this {
    // Normalize path inline
    const normalizedPath =
      path.length === 0 || path === '/'
        ? '/'
        : path.charCodeAt(0) === 47
          ? path
          : '/' + path;

    const fullPath = this.prefix.length
      ? this.normalizePath(this.prefix) + this.normalizePath(normalizedPath)
      : this.normalizePath(normalizedPath);

    // Store route definition for sub-router merging
    this.routes.push({
      method,
      path: fullPath || '/',
      handler,
      middlewares,
    });

    // Compile and register
    const allMiddlewares = this.globalMiddlewares.length
      ? [...this.globalMiddlewares, ...middlewares]
      : middlewares;

    this.registerRoute(method, fullPath || '/', handler, allMiddlewares);

    return this;
  }

  /**
   * Register a compiled route to the radix router
   */
  private registerRoute(
    method: HttpMethod,
    path: string,
    handler: RouteHandler,
    middlewares: Middleware[],
  ): void {
    const routeKey = `${method}:${path || '/'}`;
    const compiledHandler = compileMiddleware(middlewares, handler);

    this.radixRouter.insert(routeKey, { handler: compiledHandler });

    if (!this.isProductionMode) {
      this.logger.info(`Route: ${routeKey}`);
    }
  }

  /**
   * Gets the prefix string
   */
  getPrefix(): string {
    return this.prefix;
  }

  /**
   * Get all registered routes (for debugging/documentation)
   */
  getRoutes(): RouteDefinition[] {
    return [...this.routes];
  }

  /**
   * Handle incoming requests - ultra optimized hot path
   * Zero allocations except for required Response
   */
  handle(context: IRequestContext): Response | Promise<Response> {
    const { request } = context;
    const url = request.url;

    // Fast path extraction without new URL()
    // Find pathname start (after protocol://host)
    let pathStart = url.indexOf('/', 8); // Skip "https://" or "http://"
    if (pathStart === -1) pathStart = url.length;

    // Find query string start
    let queryStart = url.indexOf('?', pathStart);
    if (queryStart === -1) queryStart = url.length;

    // Extract pathname without allocation
    const pathname = url.slice(pathStart, queryStart) || '/';

    // Inline normalize
    const normalizedPath =
      pathname === '/'
        ? '/'
        : pathname.charCodeAt(pathname.length - 1) === 47
          ? pathname.slice(0, -1)
          : pathname;

    // Lookup route
    const route = this.radixRouter.lookup(
      `${request.method}:${normalizedPath}`,
    );

    if (route) {
      // Set params if any
      if (route.params) {
        context.params = route.params;
      }

      // Direct handler invocation - no middleware composition at runtime
      return route.handler(context);
    }

    // 404 - reuse static response when possible
    return NOT_FOUND_RESPONSE;
  }
}

// Pre-allocated 404 response for reuse
const NOT_FOUND_RESPONSE = new Response('Not Found', { status: 404 });
