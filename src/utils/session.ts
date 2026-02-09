/**
 * Session management utilities with Redis support
 * Uses Bun's native Redis client
 */

interface SessionData {
  [key: string]: any;
}

interface SessionOptions {
  /** Session cookie name (default: 'session') */
  cookie?: string;
  /** Session TTL in seconds (default: 86400 = 24 hours) */
  ttl?: number;
  /** Cookie options */
  cookieOptions?: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
    path?: string;
  };
  /** Key prefix in Redis (default: 'session:') */
  prefix?: string;
}

/**
 * Session store interface
 */
export interface SessionStore {
  get(sessionId: string): Promise<SessionData | null>;
  set(sessionId: string, data: SessionData, ttl: number): Promise<void>;
  destroy(sessionId: string): Promise<void>;
  touch(sessionId: string, ttl: number): Promise<void>;
}

/**
 * In-memory session store (non-distributed, for development)
 */
export class MemorySessionStore implements SessionStore {
  private sessions = new Map<string, { data: SessionData; expires: number }>();

  async get(sessionId: string): Promise<SessionData | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    if (Date.now() > session.expires) {
      this.sessions.delete(sessionId);
      return null;
    }
    return session.data;
  }

  async set(sessionId: string, data: SessionData, ttl: number): Promise<void> {
    this.sessions.set(sessionId, {
      data,
      expires: Date.now() + ttl * 1000,
    });
  }

  async destroy(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  async touch(sessionId: string, ttl: number): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.expires = Date.now() + ttl * 1000;
    }
  }
}

/**
 * Redis session store for distributed sessions
 *
 * @example
 * import { RedisClient } from 'bun';
 * import { RedisSessionStore, sessionManager } from '@thanhhoajs/thanhhoa/utils';
 *
 * const redis = new RedisClient();
 * const store = new RedisSessionStore(redis);
 * const session = sessionManager(store);
 *
 * // Create session
 * const sessionId = await session.create({ userId: 1 });
 *
 * // Get session
 * const data = await session.get(sessionId);
 *
 * // Update session
 * await session.update(sessionId, { userId: 1, lastAccess: Date.now() });
 *
 * // Destroy session
 * await session.destroy(sessionId);
 */
export class RedisSessionStore implements SessionStore {
  private redis: any;
  private prefix: string;

  constructor(redisClient: any, options: { prefix?: string } = {}) {
    this.redis = redisClient;
    this.prefix = options.prefix || 'session:';
  }

  async get(sessionId: string): Promise<SessionData | null> {
    const data = await this.redis.get(`${this.prefix}${sessionId}`);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  async set(sessionId: string, data: SessionData, ttl: number): Promise<void> {
    const key = `${this.prefix}${sessionId}`;
    await this.redis.set(key, JSON.stringify(data));
    await this.redis.expire(key, ttl);
  }

  async destroy(sessionId: string): Promise<void> {
    await this.redis.del(`${this.prefix}${sessionId}`);
  }

  async touch(sessionId: string, ttl: number): Promise<void> {
    await this.redis.expire(`${this.prefix}${sessionId}`, ttl);
  }
}

/**
 * Generate secure session ID
 */
const generateSessionId = (): string => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Create session manager with store
 *
 * @example
 * const session = sessionManager(new RedisSessionStore(redis));
 *
 * app.post('/login', async (ctx) => {
 *   const sessionId = await session.create({ userId: 1 });
 *   ctx.cookies.set('session', sessionId, { httpOnly: true });
 *   return json({ success: true });
 * });
 *
 * app.get('/profile', async (ctx) => {
 *   const sessionId = ctx.cookies.get('session');
 *   const data = await session.get(sessionId);
 *   if (!data) return json({ error: 'Not logged in' }, 401);
 *   return json({ user: data });
 * });
 */
export const sessionManager = (
  store: SessionStore,
  options: SessionOptions = {},
) => {
  const ttl = options.ttl || 86400; // 24 hours default

  return {
    async create(data: SessionData = {}): Promise<string> {
      const sessionId = generateSessionId();
      await store.set(sessionId, data, ttl);
      return sessionId;
    },

    async get(sessionId: string): Promise<SessionData | null> {
      if (!sessionId) return null;
      return store.get(sessionId);
    },

    async update(sessionId: string, data: SessionData): Promise<void> {
      if (!sessionId) return;
      await store.set(sessionId, data, ttl);
    },

    async destroy(sessionId: string): Promise<void> {
      if (!sessionId) return;
      await store.destroy(sessionId);
    },

    async touch(sessionId: string): Promise<void> {
      if (!sessionId) return;
      await store.touch(sessionId, ttl);
    },
  };
};

export type SessionManager = ReturnType<typeof sessionManager>;
