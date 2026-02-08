/**
 * Cookie utilities for ThanhHoaJS
 * Lightweight cookie handling without dependencies
 */

export interface CookieOptions {
  maxAge?: number;
  expires?: Date;
  path?: string;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

/**
 * Cookie helper class
 * Provides get/set/delete operations on cookies
 */
export class Cookies {
  private requestCookies: Map<string, string>;
  private responseCookies: Map<string, string> = new Map();

  constructor(request: Request) {
    this.requestCookies = this.parseCookies(
      request.headers.get('cookie') || '',
    );
  }

  /**
   * Parse cookie header into Map
   */
  private parseCookies(cookieHeader: string): Map<string, string> {
    const cookies = new Map<string, string>();
    if (!cookieHeader) return cookies;

    const pairs = cookieHeader.split(';');
    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i].trim();
      const eqIdx = pair.indexOf('=');
      if (eqIdx > 0) {
        const key = pair.slice(0, eqIdx).trim();
        const value = pair.slice(eqIdx + 1).trim();
        cookies.set(key, decodeURIComponent(value));
      }
    }
    return cookies;
  }

  /**
   * Get a cookie value
   */
  get(name: string): string | undefined {
    return this.requestCookies.get(name);
  }

  /**
   * Check if cookie exists
   */
  has(name: string): boolean {
    return this.requestCookies.has(name);
  }

  /**
   * Set a cookie
   */
  set(name: string, value: string, options: CookieOptions = {}): this {
    const parts: string[] = [
      `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    ];

    if (options.maxAge !== undefined) {
      parts.push(`Max-Age=${options.maxAge}`);
    }
    if (options.expires) {
      parts.push(`Expires=${options.expires.toUTCString()}`);
    }
    if (options.path) {
      parts.push(`Path=${options.path}`);
    }
    if (options.domain) {
      parts.push(`Domain=${options.domain}`);
    }
    if (options.secure) {
      parts.push('Secure');
    }
    if (options.httpOnly) {
      parts.push('HttpOnly');
    }
    if (options.sameSite) {
      parts.push(`SameSite=${options.sameSite}`);
    }

    this.responseCookies.set(name, parts.join('; '));
    return this;
  }

  /**
   * Delete a cookie
   */
  delete(
    name: string,
    options: Pick<CookieOptions, 'path' | 'domain'> = {},
  ): this {
    return this.set(name, '', {
      ...options,
      maxAge: 0,
      expires: new Date(0),
    });
  }

  /**
   * Get all Set-Cookie headers for response
   */
  getSetCookieHeaders(): string[] {
    return Array.from(this.responseCookies.values());
  }

  /**
   * Apply cookies to response headers
   */
  applyToResponse(response: Response): Response {
    const headers = new Headers(response.headers);
    for (const cookie of this.responseCookies.values()) {
      headers.append('Set-Cookie', cookie);
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }
}

/**
 * Create cookies helper from request
 */
export const createCookies = (request: Request): Cookies =>
  new Cookies(request);
