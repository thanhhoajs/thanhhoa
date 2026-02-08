import { LRUCache } from 'lru-cache';
import fastDecode from 'fast-decode-uri-component';
import { Router } from './router.core';
import type {
  IRequestContext,
  IThanhHoaServeOptions,
} from '../shared/interfaces';
import { Cookies } from './cookies.core';
import {
  WebSocketRouter,
  generateWsId,
  type WebSocketConfig,
  type WebSocketData,
} from './websocket.core';
import { DefaultErrorHandler, type IErrorHandler } from './error-handler';
import type { ServerWebSocket, Server } from 'bun';

// Pre-allocated CORS headers for OPTIONS requests - zero allocation
const CORS_METHODS = 'GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS';
const CORS_MAX_AGE = '86400';

// Pre-allocated responses for common cases
const OPTIONS_RESPONSE_HEADERS = {
  'Access-Control-Allow-Methods': CORS_METHODS,
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': CORS_MAX_AGE,
};

/**
 * ThanhHoa - Ultra-lightweight, high-performance web framework for Bun
 *
 * Features:
 * - Zero-allocation URL parsing
 * - Pre-compiled middleware chains
 * - Cookie handling
 * - Request body helpers
 * - App state sharing
 * - WebSocket support
 */
export class ThanhHoa<
  TState extends Record<string, any> = Record<string, any>,
> extends Router {
  private static readonly STATIC_CACHE_SIZE = 1000;
  private static readonly STATIC_CACHE_TTL = 60 * 60 * 1000; // 1 hour

  private staticFileCache: LRUCache<string, Response>;
  protected serveOptions: IThanhHoaServeOptions;
  private isProduction = process.env.NODE_ENV === 'production';
  private hasStaticDirs = false;
  private errorHandler: IErrorHandler = new DefaultErrorHandler();
  private shutdownHooks: Array<() => Promise<void> | void> = [];
  private server?: Server<any>;

  /** Application state - shared across all requests */
  public state: TState = {} as TState;

  /** WebSocket router */
  private wsRouter = new WebSocketRouter();

  constructor(
    protected prefix: string = '',
    options?: Partial<IThanhHoaServeOptions>,
  ) {
    super(prefix);
    this.serveOptions = {
      staticDirectories: [],
      ...options,
    };

    this.hasStaticDirs = (this.serveOptions.staticDirectories?.length ?? 0) > 0;

    // If SPA mode is enabled, ensure we have static directories configured
    if (this.serveOptions.spa && !this.hasStaticDirs) {
      console.warn(
        '[ThanhHoa] SPA mode enabled but no static directories configured.',
      );
    }

    // Only create cache if static directories are configured
    this.staticFileCache = this.hasStaticDirs
      ? new LRUCache({
          max: ThanhHoa.STATIC_CACHE_SIZE,
          ttl: ThanhHoa.STATIC_CACHE_TTL,
          updateAgeOnGet: true,
        })
      : (null as any);
  }

  /**
   * Register a WebSocket route
   *
   * @example
   * app.ws('/chat', {
   *   open(ws) { console.log('Connected'); },
   *   message(ws, msg) { ws.send(`Echo: ${msg}`); },
   *   close(ws) { console.log('Disconnected'); }
   * });
   */
  ws<T = WebSocketData>(path: string, config: WebSocketConfig<T>): this {
    this.wsRouter.ws(path, config);
    return this;
  }

  /**
   * Set a custom error handler
   */
  setErrorHandler(handler: IErrorHandler): this {
    this.errorHandler = handler;
    return this;
  }

  /**
   * Register a shutdown hook
   */
  onShutdown(hook: () => Promise<void> | void): this {
    this.shutdownHooks.push(hook);
    return this;
  }

  /**
   * Fast OPTIONS handler - pre-allocated response headers
   */
  private handleOptions(req: Request): Response {
    const origin = req.headers.get('origin');
    const requestHeaders = req.headers.get('access-control-request-headers');

    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Headers': requestHeaders || '*',
        ...OPTIONS_RESPONSE_HEADERS,
      },
    });
  }

  /**
   * Static file handler with caching
   */
  private async handleStaticFile(pathname: string): Promise<Response | null> {
    if (!this.hasStaticDirs) return null;

    // Check cache first (normal files)
    const cached = this.staticFileCache.get(pathname);
    if (cached) return cached.clone();

    const dirs = this.serveOptions.staticDirectories!;
    for (let i = 0; i < dirs.length; i++) {
      const staticDir = dirs[i];

      // Exact match or directory traversal
      if (pathname.startsWith(staticDir.path)) {
        const filePath = pathname.replace(staticDir.path, staticDir.directory);
        const file = Bun.file(`${process.cwd()}/${filePath}`);

        if (await file.exists()) {
          const response = new Response(file);
          // Cache it
          this.staticFileCache.set(pathname, response.clone());
          return response;
        }
      }
    }

    // Explicit SPA Index Request (internal use)
    if (pathname === '/index.html') {
      // Try to find index.html in any static dir
      for (let i = 0; i < dirs.length; i++) {
        const staticDir = dirs[i];
        const file = Bun.file(
          `${process.cwd()}/${staticDir.directory}/index.html`,
        );
        if (await file.exists()) {
          const response = new Response(file);
          return response;
        }
      }
    }

    return null;
  }

  /**
   * Parse query string efficiently
   */
  private createLazyQuery(
    url: string,
    queryStart: number,
  ): Record<string, string> {
    if (queryStart >= url.length) {
      return EMPTY_QUERY;
    }

    const queryString = url.slice(queryStart + 1);
    const query: Record<string, string> = {};

    let start = 0;
    const len = queryString.length;

    while (start < len) {
      let eqPos = queryString.indexOf('=', start);
      if (eqPos === -1) break;

      let ampPos = queryString.indexOf('&', eqPos);
      if (ampPos === -1) ampPos = len;

      const key = fastDecode(queryString.slice(start, eqPos));
      const value = fastDecode(queryString.slice(eqPos + 1, ampPos));

      query[key] = value;
      start = ampPos + 1;
    }

    return query;
  }

  /**
   * Create request context with all helpers
   */
  private createContext(
    req: Request,
    server: { requestIP: (req: Request) => import('bun').SocketAddress | null },
    query: Record<string, string>,
  ): IRequestContext<TState> {
    const cookies = new Cookies(req);
    const state = this.state;

    return {
      socketAddress: server.requestIP(req),
      request: req,
      params: {},
      query,
      cookies,
      state,

      // Body parsing helpers - lazy evaluation
      json<T = any>() {
        return req.json() as Promise<T>;
      },
      text() {
        return req.text();
      },
      formData() {
        return req.formData();
      },
      arrayBuffer() {
        return req.arrayBuffer();
      },
      blob() {
        return req.blob();
      },
    };
  }

  /**
   * Main request handler - ultra optimized for maximum throughput
   */
  async handleRequest(
    req: Request,
    server: {
      requestIP: (req: Request) => import('bun').SocketAddress | null;
      upgrade?: (req: Request, options: { data: WebSocketData }) => boolean;
    },
  ): Promise<Response> {
    const method = req.method;

    // Fast path for OPTIONS
    if (method === 'OPTIONS') {
      return this.handleOptions(req);
    }

    const url = req.url;

    // Zero-allocation URL parsing
    let pathStart = url.indexOf('/', 8);
    if (pathStart === -1) pathStart = url.length;

    let queryStart = url.indexOf('?', pathStart);
    if (queryStart === -1) queryStart = url.length;

    const pathname = url.slice(pathStart, queryStart) || '/';

    // WebSocket upgrade handling
    if (method === 'GET' && this.wsRouter.isWebSocketRoute(pathname)) {
      const upgraded = server.upgrade?.(req, {
        data: { id: generateWsId(), path: pathname },
      });
      if (upgraded) {
        return new Response(null, { status: 101 });
      }
      return new Response('WebSocket upgrade failed', { status: 400 });
    }

    // Static file handling
    if (this.hasStaticDirs) {
      const staticResponse = await this.handleStaticFile(pathname);
      if (staticResponse) return staticResponse;
    }

    // Create request context
    const context = this.createContext(
      req,
      server,
      this.createLazyQuery(url, queryStart),
    );

    // Production mode: direct handling
    if (this.isProduction) {
      try {
        const response = this.handle(context);
        let finalResponse =
          response instanceof Promise ? await response : response;

        // SPA Fallback
        if (
          finalResponse.status === 404 &&
          this.serveOptions.spa &&
          this.hasStaticDirs &&
          req.method === 'GET' &&
          !pathname.startsWith('/api')
        ) {
          const indexResponse = await this.handleStaticFile('/index.html');
          if (indexResponse) return indexResponse;

          // Manual check
          const dirs = this.serveOptions.staticDirectories!;
          for (const dir of dirs) {
            const file = Bun.file(
              `${process.cwd()}/${dir.directory}/index.html`,
            );
            if (await file.exists()) {
              return new Response(file);
            }
          }
        }

        // Apply CORS headers
        const origin = req.headers.get('origin');
        if (origin) {
          finalResponse.headers.set('Access-Control-Allow-Origin', origin);
          finalResponse.headers.set('Access-Control-Allow-Credentials', 'true');
        } else {
          finalResponse.headers.set('Access-Control-Allow-Origin', '*');
        }

        // Apply cookies to response
        if (context.cookies.getSetCookieHeaders().length > 0) {
          finalResponse = context.cookies.applyToResponse(finalResponse);
        }

        return finalResponse;
      } catch (error) {
        if (error instanceof Response) {
          const errRes = error;
          // Apply CORS to error response too
          const origin = req.headers.get('origin');
          if (origin) {
            errRes.headers.set('Access-Control-Allow-Origin', origin);
            errRes.headers.set('Access-Control-Allow-Credentials', 'true');
          } else {
            errRes.headers.set('Access-Control-Allow-Origin', '*');
          }
          return errRes;
        }

        // SPA Fallback
        if (
          this.serveOptions.spa &&
          this.hasStaticDirs &&
          req.method === 'GET' &&
          !pathname.startsWith('/api')
        ) {
          const indexResponse = await this.handleStaticFile('/index.html');
          if (indexResponse) return indexResponse;
        }

        return this.errorHandler.handle(error, context);
      }
    }

    // Development mode: with timing and logging
    const start = performance.now();

    try {
      const response = this.handle(context);
      let finalResponse =
        response instanceof Promise ? await response : response;

      // SPA Fallback
      if (
        finalResponse.status === 404 &&
        this.serveOptions.spa &&
        this.hasStaticDirs &&
        req.method === 'GET' &&
        !pathname.startsWith('/api')
      ) {
        const indexResponse = await this.handleStaticFile('/index.html');
        if (indexResponse) return indexResponse;

        // Manual check
        const dirs = this.serveOptions.staticDirectories!;
        for (const dir of dirs) {
          const file = Bun.file(`${process.cwd()}/${dir.directory}/index.html`);
          if (await file.exists()) {
            return new Response(file);
          }
        }
      }

      // Apply CORS headers
      const origin = req.headers.get('origin');
      if (origin) {
        finalResponse.headers.set('Access-Control-Allow-Origin', origin);
        finalResponse.headers.set('Access-Control-Allow-Credentials', 'true');
      } else {
        finalResponse.headers.set('Access-Control-Allow-Origin', '*');
      }

      // Apply cookies to response
      if (context.cookies.getSetCookieHeaders().length > 0) {
        finalResponse = context.cookies.applyToResponse(finalResponse);
      }

      return finalResponse;
    } catch (error) {
      // Don't log if it's just a 404 (handled normally) unless it's an error
      if (!(error instanceof Response && error.status === 404)) {
        this.logger.error('Error handling request:', error);
      }

      if (error instanceof Response) {
        const errRes = error;

        // SPA Fallback for 404
        if (
          errRes.status === 404 &&
          this.serveOptions.spa &&
          this.hasStaticDirs &&
          req.method === 'GET' &&
          !pathname.startsWith('/api')
        ) {
          // Try to serve index.html from the first static directory (assumption: public/index.html)
          // We need to implement a more robust way to find index.html, but for now let's try the internal helper
          const indexResponse = await this.handleStaticFile('/index.html');
          if (indexResponse) return indexResponse;

          // If not found via handleStaticFile (which expects /static/index.html mapped to public/index.html)
          // We might need to look directly in the directories
          const dirs = this.serveOptions.staticDirectories!;
          for (const dir of dirs) {
            const file = Bun.file(
              `${process.cwd()}/${dir.directory}/index.html`,
            );
            if (await file.exists()) {
              return new Response(file);
            }
          }
        }

        // Apply CORS to error response too
        const origin = req.headers.get('origin');
        if (origin) {
          errRes.headers.set('Access-Control-Allow-Origin', origin);
          errRes.headers.set('Access-Control-Allow-Credentials', 'true');
        } else {
          errRes.headers.set('Access-Control-Allow-Origin', '*');
        }
        return errRes;
      }

      return this.errorHandler.handle(error, context);
    } finally {
      const elapsed = performance.now() - start;
      this.logger.debug(`${method} ${pathname} - ${elapsed.toFixed(2)}ms`);
    }
  }

  /**
   * Gracefully shutdown the server
   */
  async shutdown() {
    this.logger.info('Shutting down server...');

    if (this.server) {
      this.server.stop();
    }

    // Run shutdown hooks
    for (const hook of this.shutdownHooks) {
      try {
        await hook();
      } catch (error) {
        this.logger.error('Error in shutdown hook:', error);
      }
    }

    this.logger.success('Server shutdown complete');
  }

  /**
   * Start the server with HTTP and WebSocket support
   */
  listen(options: IThanhHoaServeOptions) {
    this.serveOptions = { ...this.serveOptions, ...options };
    this.hasStaticDirs = (this.serveOptions.staticDirectories?.length ?? 0) > 0;

    const self = this;
    const hasWebSockets = this.wsRouter.getRoutes().size > 0;

    const serverConfig: any = {
      port: options.port,
      hostname: options.hostname,
      fetch(req: Request, srv: any) {
        return self.handleRequest(req, srv);
      },
    };

    // Add WebSocket handler if routes are registered
    if (hasWebSockets) {
      serverConfig.websocket = this.wsRouter.createHandler();
    }

    const server = Bun.serve(serverConfig);
    this.server = server;

    // Handle graceful shutdown signals
    const signals = ['SIGINT', 'SIGTERM'];
    for (const signal of signals) {
      process.on(signal, () => {
        this.logger.info(`Received ${signal}, starting graceful shutdown...`);
        this.shutdown();
      });
    }

    this.logger.success(
      `🚀 ThanhHoa server running at http://${server.hostname}:${server.port}`,
    );

    if (hasWebSockets) {
      this.logger.info(
        `🔌 WebSocket routes: ${this.wsRouter.getRoutes().size}`,
      );
    }

    return server;
  }
}

// Pre-allocated responses for reuse
const EMPTY_QUERY: Record<string, string> = Object.freeze({});
const INTERNAL_ERROR_RESPONSE = new Response('Internal Server Error', {
  status: 500,
});

export default ThanhHoa;
