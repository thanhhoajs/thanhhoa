<p align="center">
  <img src="https://drive.google.com/uc?export=view&id=1_M5tYoaKfXpqsOAPQl3WVWs9u5NWrG76" alt="ThanhHoa Logo" width="300"/>
</p>

# ThanhHoa - Ultra-High Performance Web Framework for Bun

ThanhHoa is a lightweight, blazing-fast web framework for Bun. Simple syntax with maximum performance.

## ✨ Key Features

- 🚀 **Blazing Fast** - 0.12ms average latency, ~80,000+ req/s
- 🪶 **Ultra Lightweight** - Minimal memory footprint
- 🎯 **Simple API** - Easy to learn, easy to use
- 🍪 **Cookie Handling** - Get, set, delete cookies with ease
- ✅ **Request Validation** - Built-in ajv schema validation
- 🔌 **WebSocket Support** - Native Bun WebSocket integration
- 📦 **App State** - Share state across all requests
- 🗄️ **Smart Caching** - LRU cache for static files and custom use


## 📦 Installation

```bash
bun add @thanhhoajs/thanhhoa
```

## 🚀 Quick Start

```typescript
import { ThanhHoa, json } from '@thanhhoajs/thanhhoa';

const app = new ThanhHoa();

app.get('/hello', () => json({ message: 'Hello World!' }));

app.listen({ port: 3000 });
```

## 📖 Documentation

### Basic Routing

```typescript
import { ThanhHoa, json, text, html } from '@thanhhoajs/thanhhoa';

const app = new ThanhHoa();

// GET request
app.get('/users', () => json({ users: [] }));

// POST request
app.post('/users', async (ctx) => {
  const body = await ctx.request.json();
  return json({ created: body }, 201);
});

// PUT request
app.put('/users/:id', async (ctx) => {
  const { id } = ctx.params;
  const body = await ctx.request.json();
  return json({ updated: { id, ...body } });
});

// DELETE request
app.delete('/users/:id', (ctx) => {
  return json({ deleted: ctx.params.id });
});

app.listen({ port: 3000 });
```

### Route Parameters

```typescript
app.get('/users/:id', (ctx) => {
  return json({ userId: ctx.params.id });
});

app.get('/posts/:postId/comments/:commentId', (ctx) => {
  const { postId, commentId } = ctx.params;
  return json({ postId, commentId });
});
```

### Query Parameters

```typescript
app.get('/search', (ctx) => {
  const { q, page, limit } = ctx.query;
  return json({ 
    query: q, 
    page: page || '1', 
    limit: limit || '10' 
  });
});
```

### Response Helpers

```typescript
import { json, text, html, redirect, stream, sse } from '@thanhhoajs/thanhhoa';

// JSON response
app.get('/api/data', () => json({ data: 'value' }));

// Plain text
app.get('/text', () => text('Hello World'));

// HTML response
app.get('/page', () => html('<h1>Welcome</h1>'));

// Redirect
app.get('/old-path', () => redirect('/new-path'));

// Custom status code
app.get('/created', () => json({ id: 1 }, 201));
```

### Middleware

```typescript
// Global middleware
app.use(async (ctx, next) => {
  console.log(`${ctx.request.method} ${ctx.request.url}`);
  const response = await next();
  console.log('Request completed');
  return response;
});

// Route-specific middleware
const authMiddleware = async (ctx, next) => {
  const token = ctx.request.headers.get('Authorization');
  if (!token) {
    return json({ error: 'Unauthorized' }, 401);
  }
  return next();
};

app.get('/protected', (ctx) => json({ secret: 'data' }), [authMiddleware]);
```

### Security Headers (Helmet)

```typescript
import { helmet } from '@thanhhoajs/thanhhoa/middleware';

app.use(helmet());
// or with options
app.use(helmet({
  contentSecurityPolicy: false,
  xssFilter: true
}));
```

### CORS

```typescript
import { cors } from '@thanhhoajs/thanhhoa/middleware';

app.use(cors({
  origin: 'https://example.com',
  methods: ['GET', 'POST'],
  credentials: true
}));
```

### Rate Limiting

```typescript
import { rateLimit, MemoryStore, RedisStore } from '@thanhhoajs/thanhhoa/middleware';

// In-memory (default, single instance)
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests'
}));

// With Redis (distributed, multi-instance)
import { RedisClient } from 'bun';

const redis = new RedisClient('redis://localhost:6379');

app.use(rateLimit({
  store: new RedisStore(redis),
  windowMs: 15 * 60 * 1000,
  max: 100
}));

// Custom key generator (by user ID instead of IP)
app.use(rateLimit({
  keyGenerator: (req) => req.headers.get('X-User-ID') || 'anonymous',
  max: 1000
}));

// Skip certain paths
app.use(rateLimit({
  max: 100,
  skip: ['/health', '/metrics']
}));
```

#### Sliding Window Rate Limit (Redis)

More accurate rate limiting using sliding window algorithm.

```typescript
import { slidingWindowRateLimit } from '@thanhhoajs/thanhhoa/middleware';
import { RedisClient } from 'bun';

const redis = new RedisClient();

app.use(slidingWindowRateLimit({
  redis,
  max: 100,
  windowMs: 60000
}));
```


### Logger

```typescript
import { logger } from '@thanhhoajs/thanhhoa/middleware';

app.use(logger({
  level: 'info'
}));
// Logs: GET /api/users 200 - 12.34ms
```

### Compression

```typescript
import { compress } from '@thanhhoajs/thanhhoa/middleware';

app.use(compress({
  threshold: 1024 // Only compress responses > 1KB
}));
```

### Body Size Limit

```typescript
import { bodyLimit } from '@thanhhoajs/thanhhoa/middleware';

app.use(bodyLimit({
  maxSize: 1024 * 1024, // 1MB
  message: 'Request body too large'
}));
```

### Request Timeout

```typescript
import { timeout } from '@thanhhoajs/thanhhoa/middleware';

app.use(timeout({
  ms: 30000, // 30 seconds
  message: 'Request timeout'
}));
```

### ETag (HTTP Caching)

Generate ETags for responses and handle conditional requests (`If-None-Match`).

```typescript
import { etag } from '@thanhhoajs/thanhhoa/middleware';

app.use(etag()); // Weak ETag, fast FNV-1a hash

// Strong ETag with SHA-256
app.use(etag({ weak: false, algorithm: 'sha256' }));
```

### JWT Authentication

Verify JWT tokens and attach payload to context.

```typescript
import { jwt, signToken, decodeToken } from '@thanhhoajs/thanhhoa/middleware';

// Sign a token
const token = await signToken({ userId: 1 }, 'secret', { expiresIn: 3600 });

// Middleware
app.use(jwt({
  secret: 'your-secret-key',
  skip: ['/login', '/register']
}));

app.get('/profile', (ctx) => {
  return json({ user: ctx.jwtPayload });
});

// Decode without verification (debugging)
const payload = decodeToken(token);
```

### CSRF Protection

Double-submit cookie pattern for CSRF protection.

```typescript
import { csrf } from '@thanhhoajs/thanhhoa/middleware';

app.use(csrf());

// GET token for forms
app.get('/form', (ctx) => {
  return html(`
    <form method="POST">
      <input type="hidden" name="_csrf" value="${ctx.csrfToken}">
      <button>Submit</button>
    </form>
  `);
});

// AJAX: Include X-CSRF-Token header
```

### Basic Authentication

HTTP Basic Authentication with timing-safe comparison.

```typescript
import { basicAuth } from '@thanhhoajs/thanhhoa/middleware';

// Static credentials
app.use(basicAuth({ username: 'admin', password: 'secret' }));

// Custom validation
app.use(basicAuth({
  username: '',
  password: '',
  validate: async (user, pass) => {
    return await db.verifyUser(user, pass);
  }
}));
```

### Bearer Token Authentication

API key or custom token authentication.

```typescript
import { bearerAuth } from '@thanhhoajs/thanhhoa/middleware';

// Static token
app.use(bearerAuth({ token: process.env.API_KEY }));

// Custom validation
app.use(bearerAuth({
  validate: async (token) => await db.isValidApiKey(token)
}));
```

### File Responses

Serve files, force downloads, and handle binary data.

```typescript
import { file, attachment, blob, inline } from '@thanhhoajs/thanhhoa/utils';

// Serve file with auto MIME type
app.get('/doc/:id', async (ctx) => {
  return file(`./docs/${ctx.params.id}.pdf`);
});

// Force download
app.get('/export', async () => {
  return attachment('./data.csv', 'report.csv');
});

// Binary response
app.get('/image', () => {
  const buffer = generateImage();
  return blob(buffer, 'image/png');
});

// Display inline
app.get('/preview', async () => {
  return inline('./document.pdf');
});
```

### Test Client

Test routes without starting an HTTP server.

```typescript
import { testClient } from '@thanhhoajs/thanhhoa/utils';

const app = new ThanhHoa();
app.get('/hello', () => json({ message: 'Hello!' }));

const client = testClient(app);

// Make requests
const res = await client.get('/hello');
console.log(await res.json()); // { message: 'Hello!' }

// POST with body
const postRes = await client.post('/users', {
  body: { name: 'John' },
  headers: { 'Authorization': 'Bearer token' }
});
```

### Context Data Sharing

Share data between middlewares using `ctx.set()` and `ctx.get()`.

```typescript
// In middleware
const authMiddleware = async (ctx, next) => {
  const user = await getUser(ctx);
  ctx.set('user', user);
  return next();
};

// In handler
app.get('/profile', (ctx) => {
  const user = ctx.get('user');
  return json(user);
});

// Direct access via ctx.locals Map
app.use(async (ctx, next) => {
  ctx.locals.set('startTime', Date.now());
  return next();
});
```


### Static Files

```typescript
const app = new ThanhHoa('', {
  staticDirectories: [
    { path: '/static', directory: 'public' },
    { path: '/assets', directory: 'assets' }
  ]
});

// Files in ./public will be served at /static/*
// Files in ./assets will be served at /assets/*
```

### Error Handling

```typescript
import { HttpException } from '@thanhhoajs/thanhhoa';

app.get('/error', () => {
  throw new HttpException('Something went wrong', 500);
});

app.get('/not-found', () => {
  throw new HttpException('Resource not found', 404);
});
```

### Global Error Handler

```typescript
app.setErrorHandler({
  handle(error, ctx) {
    console.error(error);
    return json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});
```

### Request ID

Automatically generate UUID for each request.

```typescript
import { requestId } from '@thanhhoajs/thanhhoa/middleware';

app.use(requestId({ header: 'X-Trace-ID' }));
```

### File Upload

Helper utility to save uploaded files.

```typescript
import { uploadFile } from '@thanhhoajs/thanhhoa/utils';

app.post('/upload', async (ctx) => {
    const formData = await ctx.formData();
    const file = formData.get('file');
    
    if (file instanceof File) {
        const result = await uploadFile(file, {
            directory: 'uploads',
            allowedTypes: ['image/png', 'image/jpeg'],
            maxSize: 5 * 1024 * 1024
        });
        return json(result);
    }
});
```

### SPA Fallback (Static Hosting)

For Single Page Applications (React, Vue, etc.), serve `index.html` for unknown routes.

```typescript
const app = new ThanhHoa({
    spa: true, // Enable SPA mode
    staticDirectories: [{ path: '/static', directory: 'public' }]
});
```

### Request Context



```typescript
interface IRequestContext {
  request: Request;           // Native Request object
  params: Record<string, string>;   // Route parameters
  query: Record<string, string>;    // Query parameters
  socketAddress: SocketAddress | null;  // Client IP info
}

app.get('/info', (ctx) => {
  return json({
    method: ctx.request.method,
    url: ctx.request.url,
    params: ctx.params,
    query: ctx.query,
    ip: ctx.socketAddress?.address
  });
});
```

### Route Groups

```typescript
// Group routes with shared prefix
app.group('/users', (router) => {
  router.get('/', () => json({ users: [] }));         // GET /users
  router.get('/:id', (ctx) => json(ctx.params));      // GET /users/:id
  router.post('/', () => json({ created: true }));    // POST /users
});

// Nested groups
app.group('/api', (api) => {
  api.group('/v1', (v1) => {
    v1.get('/status', () => json({ version: '1.0' })); // GET /api/v1/status
  });
});
```

### Mount Sub-Router

```typescript
import { Router, ThanhHoa, json } from '@thanhhoajs/thanhhoa';

// Create a sub-router
const userRouter = new Router();
userRouter.get('/', () => json({ users: [] }));
userRouter.get('/:id', (ctx) => json({ id: ctx.params.id }));
userRouter.post('/', () => json({ created: true }));

// Mount to main app
const app = new ThanhHoa();
app.mount('/api/users', userRouter);

// Routes available:
// GET /api/users
// GET /api/users/:id
// POST /api/users

app.listen({ port: 3000 });
```

### Starting the Server

```typescript
const server = app.listen({
  port: 3000,
  hostname: 'localhost'
});

console.log(`Server running at http://${server.hostname}:${server.port}`);
```

### Cookies

```typescript
// Get cookie
app.get('/profile', (ctx) => {
  const session = ctx.cookies.get('session');
  return json({ session });
});

// Set cookie
app.post('/login', async (ctx) => {
  ctx.cookies.set('session', 'abc123', {
    httpOnly: true,
    maxAge: 3600,
    path: '/'
  });
  return json({ success: true });
});

// Delete cookie
app.post('/logout', (ctx) => {
  ctx.cookies.delete('session');
  return json({ loggedOut: true });
});
```

### Request Body Parsing

```typescript
app.post('/users', async (ctx) => {
  // Parse JSON body
  const data = await ctx.json<{ name: string }>();
  
  // Or text
  const text = await ctx.text();
  
  // Or FormData
  const form = await ctx.formData();
  
  return json({ received: data });
});
```

### Request Validation (ajv)

```typescript
import { validate, validateQuery, json } from '@thanhhoajs/thanhhoa';

const userSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    email: { type: 'string', format: 'email' }
  },
  required: ['name', 'email']
};

// Middleware runs BEFORE handler
// Validated body is stored in ctx.validatedBody
app.post('/users', async (ctx) => {
  const user = ctx.validatedBody; // Already validated!
  return json({ created: user });
}, [validate(userSchema)]);

// Multiple middlewares (runs left to right, then handler)
app.post('/admin/users', adminHandler, [authMiddleware, validate(userSchema)]);

// Validate query parameters
const searchSchema = { type: 'object', properties: { q: { type: 'string' } } };
app.get('/search', searchHandler, [validateQuery(searchSchema)]);
```

### App State

```typescript
interface AppState {
  db: Database;
  config: Config;
}

const app = new ThanhHoa<AppState>();

// Set state
app.state.db = dbConnection;
app.state.config = appConfig;

// Access in handlers
app.get('/users', (ctx) => {
  const users = ctx.state.db.query('SELECT * FROM users');
  return json({ users });
});
```

### WebSocket

```typescript
app.ws('/chat', {
  open(ws) {
    console.log('Client connected:', ws.data.id);
  },
  message(ws, message) {
    ws.send(`Echo: ${message}`);
  },
  close(ws) {
    console.log('Client disconnected');
  }
});
```

### Stream Utilities

Bun-native stream utilities for maximum performance (no Response wrapper overhead).

```typescript
import {
  streamToArrayBuffer,
  streamToBytes,
  streamToText,
  streamToJSON,
  streamToBlob,
  createDirectStream,
  streamResponse,
  createBufferSink
} from '@thanhhoajs/thanhhoa/utils';

// Process large file uploads without loading into memory
app.post('/upload', async (ctx) => {
  const stream = ctx.stream();
  if (!stream) return json({ error: 'No body' }, 400);

  // Convert to various formats using Bun's native APIs
  const bytes = await streamToBytes(stream);   // Uint8Array
  const buffer = await streamToArrayBuffer(stream); // ArrayBuffer
  const text = await streamToText(stream);     // string
  const data = await streamToJSON(stream);     // parsed JSON

  return json({ size: bytes.length });
});

// Server-Sent Events with async generator
app.get('/events', () => {
  return streamResponse(async function* () {
    yield 'data: connected\n\n';
    for (let i = 0; i < 10; i++) {
      await Bun.sleep(1000);
      yield `data: tick ${i}\n\n`;
    }
  }(), {
    headers: { 'Content-Type': 'text/event-stream' }
  });
});

// Zero-copy Direct ReadableStream
app.get('/direct', () => {
  const stream = createDirectStream(async (controller) => {
    controller.write('chunk1');
    controller.write('chunk2');
  });
  return new Response(stream);
});

// Incremental buffer building
const sink = createBufferSink({ highWaterMark: 1024 * 64 });
sink.write('hello');
sink.write(' world');
const result = sink.end(); // Uint8Array
```

### Session Management

```typescript
import { sessionManager, MemorySessionStore, RedisSessionStore } from '@thanhhoajs/thanhhoa/utils';
import { RedisClient } from 'bun';

// In-memory (development)
const session = sessionManager(new MemorySessionStore());

// Redis (production)
const redis = new RedisClient();
const session = sessionManager(new RedisSessionStore(redis), {
  ttl: 86400 // 24 hours
});

// Create session
app.post('/login', async (ctx) => {
  const sessionId = await session.create({ userId: 1, role: 'admin' });
  ctx.cookies.set('session', sessionId, { httpOnly: true });
  return json({ success: true });
});

// Get session
app.get('/profile', async (ctx) => {
  const sessionId = ctx.cookies.get('session');
  const data = await session.get(sessionId);
  if (!data) return json({ error: 'Not logged in' }, 401);
  return json({ user: data });
});

// Destroy session
app.post('/logout', async (ctx) => {
  const sessionId = ctx.cookies.get('session');
  await session.destroy(sessionId);
  ctx.cookies.delete('session');
  return json({ success: true });
});
```

### Cache Utility

```typescript
import { createCache, SimpleCache } from '@thanhhoajs/thanhhoa';

// LRU Cache (recommended)
const cache = createCache<string, User>({
  max: 1000,
  ttl: 60000 // 1 minute
});

cache.set('user:1', userData);
const user = cache.get('user:1');

// Simple Cache (no LRU)
const simple = new SimpleCache<string, string>(30000);
simple.set('key', 'value');
```

## 📊 Benchmark Results


**Test Environment**: Windows 11, Bun 1.3.8

**Configuration**: 5,000 iterations × 2 requests per iteration

| Metric | Result |
|--------|--------|
| **Average Latency** | **0.12ms** |
| **Memory Usage** | **0.00 MB** (per request) |

### Performance Comparison

| Framework | Estimated RPS |
|-----------|---------------|
| Express.js | ~13,000 |
| Fastify | ~30,000 |
| Hono | ~60,000 |
| ElysiaJS | ~70,000 |
| **ThanhHoaJS** | **~80,000+** |

> 💡 For production, set `NODE_ENV=production` to enable optimizations.

## ⚡ Advanced Optimizations

### ETag Support for Binary Data

The ETag middleware now supports `ArrayBuffer` and `Blob` bodies, allowing efficient caching for images, PDFs, and other binary assets.

```typescript
import { etag } from '@thanhhoajs/thanhhoa/middleware';

// Enable ETag with optional binary support (enabled by default if body is readable)
app.use(etag({
  algorithm: 'fnv1a', // or 'sha256'
  threshold: 1024     // min size to hash
}));

app.get('/image', () => new Response(bunFile));
```

### Preloading Resources (HTTP/2 Server Push alternative)

Use `ctx.preload()` to verify add `Link` headers for resource hints, helping browsers load critical assets faster.

```typescript
app.get('/', (ctx) => {
  // Adds: Link: </style.css>; rel=preload; as=style
  ctx.preload('/style.css', 'style');
  ctx.preload('/script.js', 'script');
  
  return html('<h1>Hello</h1>');
});
```

### Redis Connection Management

Use the built-in utility to manage a singleton Redis connection, preventing connection leaks.

```typescript
import { getRedisClient } from '@thanhhoajs/thanhhoa/utils/redis';

// Auto-connects lazily (requires 'ioredis' installed)
const redis = await getRedisClient({
  host: 'localhost',
  port: 6379
});
```

Nguyen Nhu Khanh <kwalker.nnk@gmail.com>

## 📄 License

[MIT License](https://github.com/thanhhoajs/thanhhoa?tab=MIT-1-ov-file)
