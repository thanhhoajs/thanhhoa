/**
 * JWT authentication middleware
 * Verifies JWT tokens and attaches payload to context
 */

import type { Middleware } from '../shared/types';
import { json } from '../utils/response.utils';

type Algorithm = 'HS256' | 'HS384' | 'HS512';

interface JWTOptions {
  /** Secret key for HMAC algorithms */
  secret: string;
  /** Algorithm (default: HS256) */
  algorithm?: Algorithm;
  /** Header name (default: Authorization) */
  header?: string;
  /** Cookie name to check (optional, fallback) */
  cookie?: string;
  /** Skip paths (no auth required) */
  skip?: string[] | ((path: string) => boolean);
  /** Custom error response */
  onError?: (message: string) => Response;
}

interface JWTPayload {
  [key: string]: any;
  iat?: number;
  exp?: number;
  nbf?: number;
  iss?: string;
  sub?: string;
  aud?: string;
}

/**
 * Base64URL decode
 */
const base64UrlDecode = (str: string): string => {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  return atob(base64 + padding);
};

/**
 * Base64URL encode
 */
const base64UrlEncode = (str: string): string => {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

/**
 * Get crypto algorithm for Web Crypto API
 */
const getAlgorithm = (alg: Algorithm): HmacImportParams => {
  const algorithms: Record<Algorithm, string> = {
    HS256: 'SHA-256',
    HS384: 'SHA-384',
    HS512: 'SHA-512',
  };
  return { name: 'HMAC', hash: algorithms[alg] };
};

/**
 * Import secret key for signing/verification
 */
const importKey = async (
  secret: string,
  algorithm: Algorithm,
): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    getAlgorithm(algorithm),
    false,
    ['sign', 'verify'],
  );
};

/**
 * Verify JWT token
 */
const verifyToken = async (
  token: string,
  secret: string,
  algorithm: Algorithm,
): Promise<JWTPayload | null> => {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signatureB64] = parts;

  try {
    // Verify header
    const header = JSON.parse(base64UrlDecode(headerB64));
    if (header.alg !== algorithm || header.typ !== 'JWT') {
      return null;
    }

    // Verify signature
    const key = await importKey(secret, algorithm);
    const encoder = new TextEncoder();
    const data = encoder.encode(`${headerB64}.${payloadB64}`);

    // Decode signature
    const signatureStr = base64UrlDecode(signatureB64);
    const signature = new Uint8Array(signatureStr.length);
    for (let i = 0; i < signatureStr.length; i++) {
      signature[i] = signatureStr.charCodeAt(i);
    }

    const valid = await crypto.subtle.verify('HMAC', key, signature, data);
    if (!valid) return null;

    // Parse payload
    const payload: JWTPayload = JSON.parse(base64UrlDecode(payloadB64));

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && now >= payload.exp) {
      return null;
    }
    if (payload.nbf && now < payload.nbf) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
};

/**
 * Sign a JWT token
 */
export const signToken = async (
  payload: JWTPayload,
  secret: string,
  options: { algorithm?: Algorithm; expiresIn?: number } = {},
): Promise<string> => {
  const { algorithm = 'HS256', expiresIn } = options;
  const now = Math.floor(Date.now() / 1000);

  const finalPayload: JWTPayload = {
    ...payload,
    iat: now,
    ...(expiresIn ? { exp: now + expiresIn } : {}),
  };

  const header = { alg: algorithm, typ: 'JWT' };
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(finalPayload));

  const key = await importKey(secret, algorithm);
  const encoder = new TextEncoder();
  const data = encoder.encode(`${headerB64}.${payloadB64}`);

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, data);
  const signatureArray = new Uint8Array(signatureBuffer);
  const signatureStr = String.fromCharCode(...signatureArray);
  const signatureB64 = base64UrlEncode(signatureStr);

  return `${headerB64}.${payloadB64}.${signatureB64}`;
};

/**
 * Decode JWT without verification (for debugging)
 */
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(base64UrlDecode(parts[1]));
  } catch {
    return null;
  }
};

/**
 * JWT authentication middleware
 *
 * @example
 * app.use(jwt({ secret: process.env.JWT_SECRET }));
 *
 * app.get('/protected', (ctx) => {
 *   const user = ctx.jwtPayload;
 *   return json({ user });
 * });
 */
export const jwt = (options: JWTOptions): Middleware => {
  const {
    secret,
    algorithm = 'HS256',
    header = 'Authorization',
    cookie,
    skip,
    onError,
  } = options;

  const errorResponse = onError || ((msg: string) => json({ error: msg }, 401));

  return async (ctx, next) => {
    // Check skip paths
    const url = new URL(ctx.request.url);
    if (skip) {
      const shouldSkip =
        typeof skip === 'function'
          ? skip(url.pathname)
          : skip.some((p) => url.pathname.startsWith(p));
      if (shouldSkip) {
        return next();
      }
    }

    // Extract token
    let token: string | null = null;

    // Try Authorization header
    const authHeader = ctx.request.headers.get(header);
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }

    // Try cookie fallback
    if (!token && cookie) {
      token = ctx.cookies.get(cookie) || null;
    }

    if (!token) {
      return errorResponse('Missing authentication token');
    }

    // Verify token
    const payload = await verifyToken(token, secret, algorithm);
    if (!payload) {
      return errorResponse('Invalid or expired token');
    }

    // Attach payload to context
    (ctx as any).jwtPayload = payload;

    return next();
  };
};
