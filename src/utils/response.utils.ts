/**
 * Response utilities for high-performance response creation
 */

const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };
const HTML_HEADERS = { 'Content-Type': 'text/html; charset=utf-8' };
const TEXT_HEADERS = { 'Content-Type': 'text/plain; charset=utf-8' };

/**
 * JSON replacer that safely serializes BigInt values as strings
 */
const jsonReplacer = (_: string, value: unknown): unknown =>
  typeof value === 'bigint' ? value.toString() : value;

/**
 * Create a JSON response
 * @param data - Data to serialize to JSON (bigint fields are stringified)
 * @param status - HTTP status code (default: 200)
 * @param headers - Additional headers
 */
export const json = <T>(
  data: T,
  status = 200,
  headers?: HeadersInit,
): Response =>
  new Response(JSON.stringify(data, jsonReplacer), {
    status,
    headers: headers ? { ...JSON_HEADERS, ...headers } : JSON_HEADERS,
  });

/**
 * Create a plain text response
 * @param data - Text content
 * @param status - HTTP status code (default: 200)
 * @param headers - Additional headers
 */
export const text = (
  data: string,
  status = 200,
  headers?: HeadersInit,
): Response =>
  new Response(data, {
    status,
    headers: headers ? { ...TEXT_HEADERS, ...headers } : TEXT_HEADERS,
  });

/**
 * Create an HTML response
 * @param data - HTML content
 * @param status - HTTP status code (default: 200)
 * @param headers - Additional headers
 */
export const html = (
  data: string,
  status = 200,
  headers?: HeadersInit,
): Response =>
  new Response(data, {
    status,
    headers: headers ? { ...HTML_HEADERS, ...headers } : HTML_HEADERS,
  });

/**
 * Create a redirect response
 * @param url - URL to redirect to
 * @param status - HTTP status code (default: 302)
 */
export const redirect = (url: string, status = 302): Response =>
  new Response(null, {
    status,
    headers: { Location: url },
  });

/**
 * Create an empty response (204 No Content)
 */
export const noContent = (): Response => new Response(null, { status: 204 });

/**
 * Create a stream response
 * @param stream - ReadableStream
 * @param contentType - Content type (default: application/octet-stream)
 */
export const stream = (
  readable: ReadableStream,
  contentType = 'application/octet-stream',
): Response =>
  new Response(readable, {
    headers: { 'Content-Type': contentType },
  });

/**
 * Create a Server-Sent Events response
 * @param readable - ReadableStream for SSE
 */
export const sse = (readable: ReadableStream): Response =>
  new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
