import { LRUCache } from 'lru-cache';
import type { Server } from 'bun';
import {
  AsyncPool,
  container,
  HttpException,
  MODULE_METADATA_KEY,
  Router,
  ThanhHoaResponse,
  ModuleMetadata,
  type ICacheEntry,
  type IRequestContext,
  type IThanhHoaServeOptions,
} from '@thanhhoajs/thanhhoa';

/**
 * @class ThanhHoa
 * @extends Router
 * @description Main class for the ThanhHoa server framework.
 */
export class ThanhHoa extends Router {
  private static readonly CACHE_SIZE = 10000;
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private static readonly REQUEST_TIMEOUT = 30000; // 30 seconds
  private static readonly REQUEST_POOL_SIZE = 1000;

  private urlCache: LRUCache<string, ICacheEntry>;
  private staticFileCache: LRUCache<string, Response>;
  private requestPool = new AsyncPool(ThanhHoa.REQUEST_POOL_SIZE);
  protected options: IThanhHoaServeOptions;
  private moduleRegistry = new Map<string, any>();

  constructor(
    protected prefix: string = '',
    options?: Partial<IThanhHoaServeOptions>,
  ) {
    super();
    this.options = {
      staticDirectories: [],
      ...options,
    };

    // Initialize LRU Caches
    this.urlCache = new LRUCache({
      max: ThanhHoa.CACHE_SIZE,
      ttl: ThanhHoa.CACHE_TTL,
      updateAgeOnGet: true,
    });

    this.staticFileCache = new LRUCache({
      max: 1000, // Limit static file cache to 1000 entries
      ttl: 60 * 60 * 1000, // 1 hour TTL for static files
      updateAgeOnGet: true,
    });
  }

  private parseQuery(searchParams: URLSearchParams): Record<string, string> {
    return Object.fromEntries(searchParams.entries());
  }

  private async addToRequestPool<T>(task: () => Promise<T>): Promise<T> {
    return this.requestPool.execute(task);
  }

  private async handleOptions(req: Request, server: Server): Promise<Response> {
    const headers = new Headers();
    const origin = req.headers.get('origin');

    headers.set('Access-Control-Allow-Origin', origin || '*');
    headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    );
    headers.set(
      'Access-Control-Allow-Headers',
      req.headers.get('access-control-request-headers') || '*',
    );
    headers.set('Access-Control-Allow-Credentials', 'true');
    headers.set('Access-Control-Max-Age', '86400');

    return new Response(null, { status: 204, headers });
  }

  async handleRequest(req: Request, server: Server): Promise<Response> {
    return this.addToRequestPool(async () => {
      const url = new URL(req.url);

      if (req.method === 'OPTIONS') {
        return this.handleOptions(req, server);
      }

      // Cache static file responses
      if (this.options.staticDirectories?.length) {
        const cacheKey = url.pathname;
        const cachedResponse = this.staticFileCache.get(cacheKey);
        if (cachedResponse) return cachedResponse.clone();

        for (const staticDir of this.options.staticDirectories) {
          if (url.pathname.startsWith(staticDir.path)) {
            const filePath = url.pathname.replace(
              staticDir.path,
              staticDir.directory,
            );
            const file = Bun.file(`${process.cwd()}/${filePath}`);

            // Check if the file exists
            if (await file.exists()) {
              const response = new Response(file);
              this.staticFileCache.set(cacheKey, response.clone());
              return response;
            } else {
              return new Response('File Not Found', { status: 404 });
            }
          }
        }
      }

      return this.addToRequestPool(async () => {
        const start = performance.now();

        try {
          let urlEntry = this.urlCache.get(req.url);
          if (!urlEntry) {
            urlEntry = { url, timestamp: start };
            this.urlCache.set(req.url, urlEntry);
          }

          const context: IRequestContext = {
            socketAddress: server.requestIP(req),
            request: req,
            params: {},
            query: this.parseQuery(urlEntry.url.searchParams),
          };

          // Use AbortController for timeout handling
          const controller = new AbortController();
          const timeoutId = setTimeout(
            () => controller.abort(),
            ThanhHoa.REQUEST_TIMEOUT,
          );

          try {
            const response = await Promise.race([
              this.handle(context),
              new Promise<Response>((_, reject) => {
                controller.signal.addEventListener('abort', () => {
                  reject(new HttpException('Request Timeout', 408));
                });
              }),
            ]);

            if (!response) {
              return new Response('Not Found', { status: 404 });
            }

            // Handle streaming responses
            if (response.body instanceof ReadableStream) {
              return new Response(response.body, {
                status: response.status,
                headers: new Headers(response.headers),
              });
            }

            // Handle other response types
            const contentType = response.headers.get('content-type');
            const headers = new Headers(response.headers);
            headers.set(
              'content-type',
              contentType || 'application/octet-stream',
            );

            return new Response(response.body, {
              status: response.status,
              headers,
            });
          } finally {
            clearTimeout(timeoutId);
          }
        } catch (error) {
          this.logger.error('Error handling request:', error);

          if (error instanceof HttpException) {
            return new ThanhHoaResponse(error).toResponse();
          }

          throw error;
        } finally {
          const end = performance.now();
          this.logger.debug(
            `${req.method} ${req.url} - Request processed in ${end - start}ms`,
          );
        }
      });
    });
  }

  registerModule(module: any): ThanhHoa {
    // Prevent duplicate module registration
    if (this.moduleRegistry.has(module.name)) {
      return this;
    }
    this.moduleRegistry.set(module.name, module);

    const metadata = Reflect.getMetadata(MODULE_METADATA_KEY, module);
    if (!metadata) {
      throw new Error(`No module metadata found for ${module.name}`);
    }

    // Lazy load dependencies only when needed
    this.loadModuleDependencies(metadata);
    this.registerModuleProviders(metadata);
    this.registerModuleControllers(metadata);

    return this;
  }

  private loadModuleDependencies(metadata: ModuleMetadata) {
    if (metadata.imports) {
      for (const importedModule of metadata.imports) {
        this.registerModule(importedModule);
      }
    }
  }

  private registerModuleProviders(metadata: ModuleMetadata) {
    if (metadata.providers) {
      for (const provider of metadata.providers) {
        if (typeof provider === 'function') {
          // Handle class provider
          if (!container.has(provider.name)) {
            container.register(provider.name, provider);
          }
        } else {
          // Handle provider config
          const token = provider.provide;
          if (!container.has(token)) {
            if (provider.useClass) {
              container.register(token, provider.useClass);
            } else if (provider.useFactory) {
              container.register(token, provider.useFactory());
            } else if ('useValue' in provider) {
              container.register(token, provider.useValue);
            }
          }
        }
      }
    }
  }

  private registerModuleControllers(metadata: ModuleMetadata) {
    if (metadata.controllers) {
      for (const controller of metadata.controllers) {
        this.registerController(controller);
      }
    }
  }

  /**
   * Starts the ThanhHoa server and listens on the given port.
   * @param options Options for the server.
   * @returns The server instance.
   */
  listen(options: IThanhHoaServeOptions, modules: any[] = []): Server {
    // Register all modules before starting the server
    for (const module of modules) {
      this.registerModule(module);
    }

    // Merge options
    this.options = {
      ...this.options,
      ...options,
    };

    const server = Bun.serve({
      ...options,
      fetch: (req: Request, server: Server) => this.handleRequest(req, server),
    });

    this.logger.success(
      `ThanhHoa server listening on ${server.hostname}:${server.port}`,
    );

    return server;
  }
}

export default ThanhHoa;
