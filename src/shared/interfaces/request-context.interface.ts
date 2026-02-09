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
   * JWT payload (set by jwt middleware).
   */
  jwtPayload?: Record<string, any>;

  /**
   * CSRF token (set by csrf middleware).
   */
  csrfToken?: string;

  /**
   * Basic auth username (set by basicAuth middleware).
   */
  basicAuthUser?: string;

  /**
   * Bearer token (set by bearerAuth middleware).
   */
  bearerToken?: string;

  /**
   * Request-scoped locals for sharing data between middlewares.
   */
  locals: Map<string, any>;

  /**
   * Set a value in request locals.
   * @param key - Key to store value under
   * @param value - Value to store
   */
  set<T = any>(key: string, value: T): void;

  /**
   * Get a value from request locals.
   * @param key - Key to retrieve
   * @returns The stored value or undefined
   */
  get<T = any>(key: string): T | undefined;

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
   * Get request body as ReadableStream for efficient streaming of large files.
   * @returns The request body stream or null if no body
   */
  stream(): ReadableStream<Uint8Array> | null;

  /**
   * Additional request-related data.
   */
  [key: string]: any;
  /**
   * Helper to set Link header for resource preloading (HTTP/2 Server Push alternative)
   * @param path URL path to preload
   * @param as Resource type (script, style, image, etc.)
   */
  preload(
    path: string,
    as: 'script' | 'style' | 'image' | 'font' | 'fetch',
  ): void;
}
