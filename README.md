<p align="center">
  <img src="https://drive.google.com/uc?export=view&id=1_M5tYoaKfXpqsOAPQl3WVWs9u5NWrG76" alt="ThanhHoa Logo" width="300"/>
</p>

# ThanhHoa — Ultra-High Performance Web Framework for Bun

Lightweight, blazing-fast web framework built for [Bun](https://bun.sh). Two runtime dependencies. Zero compromise on speed.

[![npm version](https://img.shields.io/npm/v/@thanhhoajs/thanhhoa)](https://www.npmjs.com/package/@thanhhoajs/thanhhoa)
[![license](https://img.shields.io/npm/l/@thanhhoajs/thanhhoa)](./LICENSE)

## ✨ Features

- 🚀 **~80,000+ req/s** — 0.12ms average latency on Bun 1.3
- 🪶 **2 runtime deps** — only `radix3` + `ajv`; everything else is Bun-native
- 🎯 **Simple API** — routing, middleware, groups, sub-routers
- 🔐 **Security built-in** — JWT, CSRF, Basic/Bearer auth, helmet, CORS
- ⚡ **Brotli + gzip + deflate** — auto-negotiated compression
- 🗄️ **Zero-dep LRU cache** — internal O(1) cache, no npm package needed
- 🔌 **Native WebSocket** — per-route WebSocket handlers via Bun
- 🧪 **Test client** — test routes without starting an HTTP server

## 📦 Installation

```bash
bun add @thanhhoajs/thanhhoa
```

**Requirements:** Bun >= 1.2.0

## 🚀 Quick Start

```typescript
import { ThanhHoa, json } from '@thanhhoajs/thanhhoa';

const app = new ThanhHoa();

app.get('/hello', () => json({ message: 'Hello World!' }));

app.listen({ port: 3000 });
```

---

## 📖 Routing

### HTTP Methods

```typescript
import { ThanhHoa, json, text, html } from '@thanhhoajs/thanhhoa';

const app = new ThanhHoa();

app.get('/users', () => json({ users: [] }));
app.post('/users', async (ctx) => json(await ctx.request.json(), 201));
app.put('/users/:id', async (ctx) => json({ id: ctx.params.id }));
app.patch('/users/:id', async (ctx) => json({ updated: true }));
app.delete('/users/:id', (ctx) => json({ deleted: ctx.params.id }));
app.head('/ping', () => new Response(null, { status: 204 }));

app.listen({ port: 3000 });
```

### Route Parameters & Query

```typescript
// Dynamic params
app.get('/posts/:postId/comments/:commentId', (ctx) => {
  const { postId, commentId } = ctx.params;
  return json({ postId, commentId });
});

// Query string
app.get('/search', (ctx) => {
  const { q, page = '1', limit = '10' } = ctx.query;
  return json({ q, page, limit });
});
```

### Route Groups

```typescript
app.group('/api', (api) => {
  api.group('/v1', (v1) => {
    v1.get('/status', () => json({ version: '1.0' })); // GET /api/v1/status
    v1.get('/users', () => json({ users: [] }));        // GET /api/v1/users
  });
});
```

### Sub-Routers

```typescript
import { Router, ThanhHoa, json } from '@thanhhoajs/thanhhoa';

const userRouter = new Router();
userRouter.get('/', () => json({ users: [] }));
userRouter.get('/:id', (ctx) => json({ id: ctx.params.id }));
userRouter.post('/', () => json({ created: true }, 201));

const app = new ThanhHoa();
app.mount('/users', userRouter);
// Routes: GET /users, GET /users/:id, POST /users

app.listen({ port: 3000 });
```

---

## 🛠️ Response Helpers

```typescript
import { json, text, html, redirect } from '@thanhhoajs/thanhhoa';

app.get('/json',     () => json({ data: 'value' }));
app.get('/text',     () => text('Hello World'));
app.get('/page',     () => html('<h1>Welcome</h1>'));
app.get('/old-path', () => redirect('/new-path'));
app.get('/created',  () => json({ id: 1 }, 201));

// BigInt is serialized safely
app.get('/bigint', () => json({ id: 9007199254740993n }));
```

---

## 🔗 Middleware

```typescript
// Global middleware
app.use(async (ctx, next) => {
  const start = Date.now();
  const response = await next();
  console.log(`${ctx.request.method} ${ctx.request.url} — ${Date.now() - start}ms`);
  return response;
});

// Route-level middleware
const auth = async (ctx, next) => {
  if (!ctx.request.headers.get('Authorization')) {
    return json({ error: 'Unauthorized' }, 401);
  }
  return next();
};

app.get('/protected', (ctx) => json({ ok: true }), [auth]);
```

### Context (`ctx`) API

```typescript
ctx.request         // Native Fetch API Request
ctx.params          // Route params: { id: '42' }
ctx.query           // Query string: { q: 'search' }
ctx.cookies         // Cookie interface (get/set/delete)
ctx.socketAddress   // Client IP info
ctx.state           // Typed app-wide state
ctx.locals          // Request-scoped Map (ctx.set / ctx.get)
ctx.validatedBody   // Body after validate() middleware
ctx.jwtPayload      // JWT payload after jwt() middleware
ctx.csrfToken       // CSRF token after csrf() middleware

// Shortcut body parsers
await ctx.json<T>()
await ctx.text()
await ctx.formData()
ctx.stream()

// Resource preloading (Link header)
ctx.preload('/style.css', 'style');
ctx.preload('/app.js', 'script');
```

---

## 🔐 Security Middleware

### JWT Authentication

```typescript
import { jwt, signToken, verifyToken, decodeToken } from '@thanhhoajs/thanhhoa';

const token = await signToken({ userId: 1 }, 'your-secret', { expiresIn: 3600 });

app.use(jwt({
  secret: 'your-secret',
  skip: ['/login', '/register']
}));

app.get('/profile', (ctx) => json({ user: ctx.jwtPayload }));

const payload = decodeToken(token); // Decode without verification
```

### CSRF Protection

```typescript
import { csrf } from '@thanhhoajs/thanhhoa';

app.use(csrf());

app.get('/form', (ctx) => html(`
  <form method="POST" action="/submit">
    <input type="hidden" name="_csrf" value="${ctx.csrfToken}">
    <button>Submit</button>
  </form>
`));
// AJAX: send X-CSRF-Token header with the token value
```

### Basic Auth

```typescript
import { basicAuth } from '@thanhhoajs/thanhhoa';

app.use(basicAuth({ username: 'admin', password: 'secret' }));

// Custom validation
app.use(basicAuth({
  username: '',
  password: '',
  validate: async (user, pass) => db.verifyUser(user, pass)
}));
```

### Bearer Token Auth

```typescript
import { bearerAuth } from '@thanhhoajs/thanhhoa';

app.use(bearerAuth({ token: process.env.API_KEY! }));

// Dynamic validation
app.use(bearerAuth({
  validate: async (token) => db.isValidApiKey(token)
}));
```

### Security Headers (Helmet)

```typescript
import { helmet } from '@thanhhoajs/thanhhoa';

app.use(helmet());
app.use(helmet({ contentSecurityPolicy: false }));
```

### CORS

```typescript
import { cors } from '@thanhhoajs/thanhhoa';

app.use(cors({
  origin: 'https://example.com',
  methods: ['GET', 'POST'],
  credentials: true
}));
```

---

## ⚡ Performance Middleware

### Compression (Brotli / Gzip / Deflate)

Auto-negotiated via `Accept-Encoding`. Brotli (`br`) is preferred when available.

```typescript
import { compress } from '@thanhhoajs/thanhhoa';

app.use(compress()); // br > gzip > deflate (default)

app.use(compress({
  threshold: 1024,           // Only compress > 1KB
  encoding: ['gzip'],        // Force gzip only
}));
```

### Cache-Control

```typescript
import {
  cacheControl,
  noStore,
  publicCache,
  privateCache
} from '@thanhhoajs/thanhhoa';

// API routes — no caching
app.group('/api', (r) => { /* ... */ }, [noStore()]);

// Public CDN assets — 1 hour, stale-while-revalidate
app.use(publicCache(3600, { staleWhileRevalidate: 60 }));

// Per-user content — browser cache only, 5 min
app.use(privateCache(300));

// Versioned static assets — immutable, 1 year
app.use(publicCache(31536000, { immutable: true }));

// Full control
app.use(cacheControl({
  maxAge: 3600,
  staleIfError: 86400,
  mustRevalidate: true,
  skip: ['/health']
}));
```

### Rate Limiting

```typescript
import { rateLimit, MemoryStore } from '@thanhhoajs/thanhhoa';

// In-memory (single instance)
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests'
}));

// Redis (distributed)
import { RedisClient } from 'bun';
import { RedisStore } from '@thanhhoajs/thanhhoa';

const redis = new RedisClient('redis://localhost:6379');
app.use(rateLimit({ store: new RedisStore(redis), windowMs: 60000, max: 100 }));

// Custom key (by user ID instead of IP)
app.use(rateLimit({
  keyGenerator: (req) => req.headers.get('X-User-ID') ?? 'anon',
  max: 1000
}));

// Skip paths
app.use(rateLimit({ max: 100, skip: ['/health', '/metrics'] }));
```

#### Sliding Window Rate Limit (Redis)

```typescript
import { slidingWindowRateLimit } from '@thanhhoajs/thanhhoa';

app.use(slidingWindowRateLimit({ redis, max: 100, windowMs: 60000 }));
```

### ETag (HTTP Caching)

```typescript
import { etag } from '@thanhhoajs/thanhhoa';

app.use(etag());                              // Weak ETag, FNV-1a
app.use(etag({ weak: false, algorithm: 'sha256' })); // Strong ETag
```

---

## 🛡️ Request Middleware

### Body Size Limit

```typescript
import { bodyLimit } from '@thanhhoajs/thanhhoa';

app.use(bodyLimit({ maxSize: 1024 * 1024 })); // 1 MB
```

### Request Timeout

```typescript
import { timeout } from '@thanhhoajs/thanhhoa';

app.use(timeout({ ms: 30000, message: 'Request timed out' }));
```

### Request ID

Stored in `ctx.get('requestId')` and `X-Request-ID` response header.

```typescript
import { requestId } from '@thanhhoajs/thanhhoa';

app.use(requestId());
app.use(requestId({ header: 'X-Trace-ID' }));
```

### Logger

```typescript
import { logger } from '@thanhhoajs/thanhhoa';

app.use(logger());
// [THANHHOA] GET /api/users 200 — 2.41ms
```

---

## ✅ Validation (ajv)

```typescript
import { validate, validateQuery, validateParams } from '@thanhhoajs/thanhhoa';

const userSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    email: { type: 'string', format: 'email' }
  },
  required: ['name', 'email']
};

app.post('/users', async (ctx) => {
  const user = ctx.validatedBody; // Already validated and typed
  return json({ created: user }, 201);
}, [validate(userSchema)]);

// Query params
app.get('/search', handler, [validateQuery({ type: 'object', properties: { q: { type: 'string' } } })]);
```

---

## 🍪 Cookies

```typescript
app.get('/profile', (ctx) => {
  const session = ctx.cookies.get('session');
  return json({ session });
});

app.post('/login', (ctx) => {
  ctx.cookies.set('session', 'token123', {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    maxAge: 3600
  });
  return json({ success: true });
});

app.post('/logout', (ctx) => {
  ctx.cookies.delete('session');
  return json({ loggedOut: true });
});
```

---

## 📁 Static Files & SPA

```typescript
const app = new ThanhHoa({
  staticDirectories: [
    { path: '/static', directory: 'public' },
    { path: '/assets', directory: 'assets' }
  ],
  spa: true // Serve index.html for unknown routes
});
```

---

## 🔌 WebSocket

```typescript
app.ws('/chat', {
  open(ws) {
    console.log('Connected:', ws.data.id);
    ws.subscribe('room:1');
  },
  message(ws, msg) {
    ws.publish('room:1', msg);
  },
  close(ws, code, reason) {
    console.log('Disconnected');
  }
});
```

---

## 📂 File Responses

```typescript
import { file, attachment, inline, blob } from '@thanhhoajs/thanhhoa';

app.get('/pdf/:id',  (ctx) => file(`./docs/${ctx.params.id}.pdf`));
app.get('/export',   () => attachment('./data.csv', 'report.csv'));
app.get('/preview',  () => inline('./document.pdf'));
app.get('/image',    () => blob(generateBuffer(), 'image/png'));
```

---

## 📤 File Upload

```typescript
import { uploadFile } from '@thanhhoajs/thanhhoa';

app.post('/upload', async (ctx) => {
  const formData = await ctx.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) return json({ error: 'No file' }, 400);

  const result = await uploadFile(file, {
    directory: 'uploads',
    allowedTypes: ['image/png', 'image/jpeg'],
    maxSize: 5 * 1024 * 1024 // 5 MB
  });

  return json(result);
});
```

---

## 🌊 Streams & SSE

```typescript
import { streamResponse, createDirectStream } from '@thanhhoajs/thanhhoa';

// Server-Sent Events
app.get('/events', () =>
  streamResponse(async function* () {
    yield 'data: connected\n\n';
    for (let i = 0; i < 10; i++) {
      await Bun.sleep(1000);
      yield `data: tick ${i}\n\n`;
    }
  }(), { headers: { 'Content-Type': 'text/event-stream' } })
);

// Zero-copy direct stream
app.get('/stream', () => {
  const body = createDirectStream(async (ctrl) => {
    ctrl.write('hello ');
    ctrl.write('world');
  });
  return new Response(body);
});
```

---

## 🗄️ Session Management

```typescript
import { sessionManager, MemorySessionStore, RedisSessionStore } from '@thanhhoajs/thanhhoa';
import { RedisClient } from 'bun';

// Development: in-memory
const session = sessionManager(new MemorySessionStore());

// Production: Redis
const session = sessionManager(new RedisSessionStore(new RedisClient()), {
  ttl: 86400 // 24 hours
});

app.post('/login', async (ctx) => {
  const id = await session.create({ userId: 1, role: 'admin' });
  ctx.cookies.set('session', id, { httpOnly: true, secure: true });
  return json({ success: true });
});

app.get('/me', async (ctx) => {
  const data = await session.get(ctx.cookies.get('session')!);
  if (!data) return json({ error: 'Not logged in' }, 401);
  return json(data);
});

app.post('/logout', async (ctx) => {
  await session.destroy(ctx.cookies.get('session')!);
  ctx.cookies.delete('session');
  return json({ success: true });
});
```

---

## 🧪 Testing (No HTTP server needed)

```typescript
import { testClient } from '@thanhhoajs/thanhhoa';

const app = new ThanhHoa();
app.get('/hello', () => json({ message: 'Hello!' }));

const client = testClient(app);

const res = await client.get('/hello');
console.log(await res.json()); // { message: 'Hello!' }

const post = await client.post('/users', {
  body: { name: 'John' },
  headers: { Authorization: 'Bearer token' }
});
```

---

## 🔌 App State

```typescript
interface AppState {
  db: Database;
  config: Config;
}

const app = new ThanhHoa<AppState>();
app.state.db = dbConnection;

app.get('/users', (ctx) => {
  const users = ctx.state.db.query('SELECT * FROM users');
  return json({ users });
});
```

---

## 🚀 Starting the Server

```typescript
// Basic
app.listen({ port: 3000 });

// With hostname
app.listen({ port: 3000, hostname: '0.0.0.0' });

// HTTPS (TLS)
app.listen({
  port: 443,
  tls: {
    key: Bun.file('./server.key'),
    cert: Bun.file('./server.cert')
  }
});
```

---

## 🗄️ LRU Cache Utility

Built-in O(1) LRU cache — no npm dependency required.

```typescript
import { LRUCache } from '@thanhhoajs/thanhhoa';

const cache = new LRUCache<string, User>({
  max: 1000,
  ttl: 60_000,        // ms, optional
  updateAgeOnGet: true
});

cache.set('user:1', userData);
const user = cache.get('user:1'); // undefined if expired or evicted
cache.has('user:1');
cache.delete('user:1');
cache.clear();
```

---

## 🔴 Error Handling

```typescript
import { HttpException } from '@thanhhoajs/thanhhoa';

// Throw from anywhere — returns correct status automatically
app.get('/item/:id', (ctx) => {
  throw new HttpException('Not found', 404);
});

// Custom global error handler
app.setErrorHandler({
  handle(error, ctx) {
    if (error instanceof HttpException) return error.toResponse();
    return json({ error: 'Internal Server Error' }, 500);
  }
});
```

---

## 📊 Benchmark Results

**Environment:** Windows 11, Bun 1.3.8
**Config:** 5,000 iterations × 2 requests per iteration

| Metric | Result |
|---|---|
| Average Latency | **0.12ms** |
| Throughput | **~80,000+ req/s** |

| Framework | Estimated RPS |
|---|---|
| Express.js | ~13,000 |
| Fastify | ~30,000 |
| Hono | ~60,000 |
| ElysiaJS | ~70,000 |
| **ThanhHoaJS** | **~80,000+** |

> Set `NODE_ENV=production` for maximum performance.

---

## 📄 License

[MIT](https://github.com/thanhhoajs/thanhhoa?tab=MIT-1-ov-file) © Nguyen Nhu Khanh
