import type { ServeOptions, Server } from 'bun';
import {
  Router,
  ThanhHoaResponse,
  type HttpException,
  type IRequestContext,
} from '@thanhhoajs/thanhhoa';

/**
 * @class ThanhHoa
 * @extends Router
 * @description Main class for the ThanhHoa server framework.
 */
export class ThanhHoa extends Router {
  /**
   * Parses the query string into an object of key-value pairs.
   *
   * @param {URLSearchParams} searchParams - The query string to parse.
   * @returns {Record<string, string>} An object of key-value pairs.
   * @private
   */
  private parseQuery(searchParams: URLSearchParams): Record<string, string> {
    return Object.fromEntries(searchParams);
  }

  /**
   * Handles an incoming HTTP request.
   *
   * @param {Request} req - The incoming request.
   * @returns {Promise<Response>} A promise of the response.
   *
   * @throws {HttpException} If the request could not be handled successfully.
   * @throws {Error} If an unexpected error occurred while handling the request.
   */
  private async handleRequest(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const context: IRequestContext = {
      request: req,
      params: {},
      query: this.parseQuery(url.searchParams),
    };

    try {
      return (
        (await this.handle(context)) ??
        new Response('Not Found', { status: 404 })
      );
    } catch (error: HttpException | any) {
      this.logger.error(`Error handling request: ${error}`);
      const response = new ThanhHoaResponse(error);
      return response.toResponse();
    }
  }

  /**
   * Starts the ThanhHoa server with the provided options.
   *
   * @param {Omit<ServeOptions, 'fetch'>} options - The server options excluding the 'fetch' handler.
   * @returns {Server} The Bun server instance.
   */
  listen(options: Omit<ServeOptions, 'fetch'>): Server {
    const server = Bun.serve({
      ...options,
      fetch: (req) => this.handleRequest(req),
    });

    this.logger.info(`ThanhHoa server listening on ${server.url}`);
    return server;
  }
}

export default ThanhHoa;
