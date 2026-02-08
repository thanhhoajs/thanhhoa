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
import { rateLimit } from '@thanhhoajs/thanhhoa/middleware';

app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests'
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

## 👤 Author

Nguyen Nhu Khanh <kwalker.nnk@gmail.com>

## 📄 License

[MIT License](https://github.com/thanhhoajs/thanhhoa?tab=MIT-1-ov-file)
