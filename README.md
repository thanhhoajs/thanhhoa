<p align="center">
  <img src="https://drive.google.com/uc?export=view&id=1_M5tYoaKfXpqsOAPQl3WVWs9u5NWrG76" alt="ThanhHoa Logo" width="300"/>
</p>

# ThanhHoa - Ultra-High Performance Web Framework for Bun

ThanhHoa is a lightweight, blazing-fast web framework for Bun. Simple syntax with maximum performance.

## ✨ Key Features

- 🚀 **Blazing Fast** - 0.12ms average latency, ~80,000+ req/s
- 🪶 **Ultra Lightweight** - Minimal memory footprint
- 🎯 **Simple API** - Easy to learn, easy to use
- 🔒 **Built-in Security** - CORS handling out of the box
- 🗄️ **Smart Caching** - LRU cache for static files

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

### Starting the Server

```typescript
const server = app.listen({
  port: 3000,
  hostname: 'localhost'
});

console.log(`Server running at http://${server.hostname}:${server.port}`);
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
