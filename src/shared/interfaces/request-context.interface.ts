import type { SocketAddress } from 'bun';
import type { Cookies } from '../../core/cookies.core';

/**
 * Represents the context of an incoming request.
 * @interface IRequestContext
 * @description Provides access to the request, route parameters, query parameters, and other request-related data.
 */
export interface IRequestContext<TState = Record<string, any>> {
  /**
   * The socketAddress of the incoming request.
   */
  socketAddress: SocketAddress | null;

  /**
   * The incoming request object.
   */
  request: Request;

  /**
   * Route parameters extracted from the request URL.
   */
  params: Record<string, string>;

  /**
   * Query parameters extracted from the request URL.
   */
  query: Record<string, string>;

  /**
   * Cookie helper for get/set/delete cookies.
   */
  cookies: Cookies;

  /**
   * Application state (shared across all requests).
   */
  state: TState;

  /**
   * Validated request body (set by validation middleware).
   */
  validatedBody?: any;

  /**
   * Parse request body as JSON.
   */
  json<T = any>(): Promise<T>;

  /**
   * Parse request body as text.
   */
  text(): Promise<string>;

  /**
   * Parse request body as FormData.
   */
  formData(): Promise<FormData>;

  /**
   * Parse request body as ArrayBuffer.
   */
  arrayBuffer(): Promise<ArrayBuffer>;

  /**
   * Parse request body as Blob.
   */
  blob(): Promise<Blob>;

  /**
   * Additional request-related data.
   */
  [key: string]: any;
}
