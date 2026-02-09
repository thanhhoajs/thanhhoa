/**
 * Test client for ThanhHoaJS
 * Test routes without starting an HTTP server
 */

import type { ThanhHoa } from '../core/thanh-hoa.core';

interface TestRequestOptions {
  /** HTTP method (default: GET) */
  method?: string;
  /** Request headers */
  headers?: Record<string, string>;
  /** Request body */
  body?: string | object | FormData;
  /** Query parameters */
  query?: Record<string, string>;
}

interface TestResponse {
  /** HTTP status code */
  status: number;
  /** Status text */
  statusText: string;
  /** Response headers */
  headers: Headers;
  /** Get response as text */
  text: () => Promise<string>;
  /** Get response as JSON */
  json: <T = any>() => Promise<T>;
  /** Get response as ArrayBuffer */
  arrayBuffer: () => Promise<ArrayBuffer>;
  /** Get response as Blob */
  blob: () => Promise<Blob>;
  /** Original Response object */
  raw: Response;
}

/**
 * Create a test request and get response without HTTP server
 *
 * @example
 * import { ThanhHoa } from '@thanhhoajs/thanhhoa';
 * import { testClient } from '@thanhhoajs/thanhhoa/utils';
 *
 * const app = new ThanhHoa();
 * app.get('/hello', () => json({ message: 'Hello!' }));
 *
 * // Test the route
 * const client = testClient(app);
 * const res = await client.get('/hello');
 * console.log(await res.json()); // { message: 'Hello!' }
 */
export const testClient = (app: ThanhHoa) => {
  const request = async (
    path: string,
    options: TestRequestOptions = {},
  ): Promise<TestResponse> => {
    const { method = 'GET', headers = {}, body, query } = options;

    // Build URL with query params
    let url = `http://localhost${path}`;
    if (query) {
      const params = new URLSearchParams(query);
      url += `?${params.toString()}`;
    }

    // Prepare body
    let requestBody: BodyInit | undefined;
    const requestHeaders: Record<string, string> = { ...headers };

    if (body) {
      if (typeof body === 'string') {
        requestBody = body;
      } else if (body instanceof FormData) {
        requestBody = body;
      } else {
        requestBody = JSON.stringify(body);
        if (!requestHeaders['Content-Type']) {
          requestHeaders['Content-Type'] = 'application/json';
        }
      }
    }

    // Create request
    const request = new Request(url, {
      method,
      headers: requestHeaders,
      body: requestBody,
    });

    // Mock server object for requestIP
    const mockServer = {
      requestIP: () => ({ address: '127.0.0.1', port: 0, family: 'IPv4' }),
    };

    // Call app's request handler directly
    const response = await (app as any).handleRequest(request, mockServer);

    // Wrap response
    return {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      text: () => response.clone().text(),
      json: <T>() => response.clone().json() as Promise<T>,
      arrayBuffer: () => response.clone().arrayBuffer(),
      blob: () => response.clone().blob(),
      raw: response,
    };
  };

  // Shorthand methods
  return {
    request,
    get: (path: string, options?: Omit<TestRequestOptions, 'method'>) =>
      request(path, { ...options, method: 'GET' }),
    post: (path: string, options?: Omit<TestRequestOptions, 'method'>) =>
      request(path, { ...options, method: 'POST' }),
    put: (path: string, options?: Omit<TestRequestOptions, 'method'>) =>
      request(path, { ...options, method: 'PUT' }),
    patch: (path: string, options?: Omit<TestRequestOptions, 'method'>) =>
      request(path, { ...options, method: 'PATCH' }),
    delete: (path: string, options?: Omit<TestRequestOptions, 'method'>) =>
      request(path, { ...options, method: 'DELETE' }),
    head: (path: string, options?: Omit<TestRequestOptions, 'method'>) =>
      request(path, { ...options, method: 'HEAD' }),
    options: (path: string, options?: Omit<TestRequestOptions, 'method'>) =>
      request(path, { ...options, method: 'OPTIONS' }),
  };
};

export type TestClient = ReturnType<typeof testClient>;
