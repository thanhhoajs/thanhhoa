import type { SocketAddress } from 'bun';

/**
 * Represents the context of an incoming request.
 * @interface IRequestContext
 * @description Provides access to the request, route parameters, query parameters, and other request-related data.
 */
export interface IRequestContext {
  /**
   * The socketAddress of the incoming request.
   * @type {SocketAddress}
   */
  socketAddress: SocketAddress | null;

  /**
   * The incoming request object.
   * @type {Request}
   */
  request: Request;

  /**
   * Route parameters extracted from the request URL.
   * @type {Record<string, string>}
   */
  params: Record<string, string>;

  /**
   * Query parameters extracted from the request URL.
   * @type {Record<string, string>}
   */
  query: Record<string, string>;

  /**
   * Additional request-related data.
   * @type {any}
   */
  [key: string]: any;
}
