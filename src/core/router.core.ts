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
 * Optimized for maximum throughput like Rust Axum
 *
 * Key optimizations:
 * - Pre-compiled middleware chains
 * - Zero-cost path normalization
 * - Minimal allocations on hot path
 */
export class Router {
  // Store pre-compiled handlers for instant invocation
  private radixRouter = createRouter<{
    handler: CompiledHandler;
  }>();

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
   * Note: Adding middleware after routes are registered will require re-compilation
   */
  use(middleware: Middleware): this {
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
      ? `${method}:${this.normalizePath(this.prefix)}${this.normalizePath(normalizedPath)}`
      : `${method}:${this.normalizePath(normalizedPath)}`;

    // Compile middleware chain at registration time - not runtime!
    const allMiddlewares = this.globalMiddlewares.length
      ? [...this.globalMiddlewares, ...middlewares]
      : middlewares;

    const compiledHandler = compileMiddleware(allMiddlewares, handler);

    this.radixRouter.insert(fullPath, { handler: compiledHandler });

    // Only log in development
    if (!this.isProductionMode) {
      this.logger.info(`Route: ${fullPath}`);
    }

    return this;
  }

  /**
   * Mount a group of routes with a common prefix
   */
  group(prefix: string, configure: (router: Router) => void): this {
    const subRouter = new Router(this.prefix + prefix);
    subRouter.globalMiddlewares = [...this.globalMiddlewares];
    configure(subRouter);
    return this;
  }

  /**
   * Gets the prefix string
   */
  getPrefix(): string {
    return this.prefix;
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
    const pathname = url.slice(pathStart, queryStart);

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
