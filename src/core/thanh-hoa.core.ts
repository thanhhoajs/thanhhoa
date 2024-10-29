import type { ServeOptions, Server } from 'bun';
import {
  HttpException,
  Router,
  ThanhHoaResponse,
  type ICacheEntry,
  type IRequestContext,
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

  private urlCache: Map<string, ICacheEntry> = new Map();
  private requestPool = new Set<Promise<any>>();
  private maxConcurrent = 1000;

  constructor(protected prefix: string = '') {
    super();
    setInterval(() => this.cleanCache(), 60000);
  }

  private cleanCache(): void {
    const now = performance.now();
    for (const [key, entry] of this.urlCache) {
      if (now - entry.timestamp > ThanhHoa.CACHE_TTL) {
        this.urlCache.delete(key);
      }
    }
  }

  private parseQuery(searchParams: URLSearchParams): Record<string, string> {
    return Object.fromEntries(searchParams.entries());
  }

  private async addToRequestPool<T>(task: () => Promise<T>): Promise<T> {
    if (this.requestPool.size >= this.maxConcurrent) {
      await Promise.race(Array.from(this.requestPool));
    }

    const promise = task();
    this.requestPool.add(promise);

    try {
      return await promise;
    } finally {
      this.requestPool.delete(promise);
    }
  }

  async handleRequest(req: Request): Promise<Response> {
    return this.addToRequestPool(async () => {
      const start = performance.now();

      try {
        let urlEntry = this.urlCache.get(req.url);
        if (
          !urlEntry ||
          performance.now() - urlEntry.timestamp > ThanhHoa.CACHE_TTL
        ) {
          const url = new URL(req.url);
          urlEntry = { url, timestamp: start };

          if (this.urlCache.size >= ThanhHoa.CACHE_SIZE) {
            const oldestKey = this.urlCache.keys().next().value;
            if (oldestKey !== undefined) {
              this.urlCache.delete(oldestKey);
            }
          }

          this.urlCache.set(req.url, urlEntry);
        }

        const context: IRequestContext = {
          request: req,
          params: {},
          query: this.parseQuery(urlEntry.url.searchParams),
        };

        // Use AbortController Bun's
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

          // Stream response with ReadableStream
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
        this.logger.debug(`Request processed in ${end - start}ms`);
      }
    });
  }

  /**
   * Starts the ThanhHoa server and listens on the given port.
   * @param options Options for the server.
   * @returns The server instance.
   */
  listen(options: Omit<ServeOptions, 'fetch'>): Server {
    const server = Bun.serve({
      ...options,
      fetch: (req) => this.handleRequest(req),
    });

    this.logger.success(
      `ThanhHoa server listening on ${server.hostname}:${server.port}`,
    );

    return server;
  }
}

export default ThanhHoa;
