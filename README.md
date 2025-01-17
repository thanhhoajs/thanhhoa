<p align="center">
  <img src="https://drive.google.com/uc?export=view&id=1_M5tYoaKfXpqsOAPQl3WVWs9u5NWrG76" alt="ThanhHoa Logo" width="300"/>
</p>

# @thanhhoajs/thanhhoa

ThanhHoa is a high-performance, lightweight web framework for Bun, crafted to simplify server-side development while delivering maximum speed.

## Features

- 🚀 **Built for Speed**: Utilizes Bun's non-blocking I/O for ultra-fast request processing.
- 🧩 **Modular Design**: Simple and flexible middleware system.
- 🛣️ **Intuitive Routing**: Supports parameters and dynamic paths.
- 🎛️ **Full HTTP Support**: Handles GET, POST, PUT, PATCH, and DELETE methods.
- 🔒 **Standardized Error Handling**: Comes with `HttpException` for structured error responses.
- 🎭 **TypeScript Support**: Fully typed for a streamlined developer experience.
- 🗄️ **Built-in Caching**: URL caching for optimized performance.
- ⏱️ **Request Timeout**: Configurable timeout for managing long-running requests.
- 🧹 **Automatic Cache Cleanup**: Regular cleanup of stale cache entries.
- 🌐 **CORS Middleware**: Flexible configuration for CORS and security headers.
- 🛡️ **Helmet Middleware**: Enhanced HTTP security headers.
- 📈 **Rate Limiting**: Middleware for managing request rates from clients.
- 🗜️ **Response Compression**: Gzip compression middleware to reduce response size.
- 🗂️ **Custom Static Directories**: Supports multiple static directories for organized file management.

## Installation

Install ThanhHoa with Bun:

```bash
bun add @thanhhoajs/thanhhoa
```

## Quick Start

Here’s a quick setup to get started with ThanhHoa:

```typescript
import { ThanhHoa, type IRequestContext } from '@thanhhoajs/thanhhoa';

const app = new ThanhHoa();

app.get('/', (ctx: IRequestContext) => {
  return new Response('Hello, ThanhHoa!', {
    headers: { 'Content-Type': 'text/plain' },
  });
});

app.listen({ port: 3000 });
```

Run your app:

```bash
bun run app.ts
```

Visit `http://localhost:3000` to see "Hello, ThanhHoa!" in your browser.

## Routing

ThanhHoa offers flexible routing with support for dynamic parameters:

```typescript
app.get('/user/:id', (ctx: IRequestContext) => {
  return new Response(`User ID: ${ctx.params.id}`);
});

app.post('/user', async (ctx: IRequestContext) => {
  const body = await ctx.request.json();
  // Process the body...
  return new Response('User created', { status: 201 });
});
```

## Middleware

ThanhHoa allows you to add middleware globally or for specific routes:

```typescript
// Custom middleware
const logger = async (ctx: IRequestContext, next: INextFunction) => {
  console.log(`${ctx.request.method} ${ctx.request.url}`);
  return next();
};

app.use(logger);
app.use(corsMiddleware());
app.use(helmetMiddleware());
app.use(rateLimiter({...}));
app.use(cacheMiddleware());
app.use(compression({...}));

app.get('/protected', authMiddleware, (ctx: IRequestContext) => {
  return new Response('Protected route');
});
```

## Static Directory Support

Easily serve static files from multiple directories:

```typescript
const app = new ThanhHoa();

app.listen({
  port: 3000,
  staticDirectories: [
    {
      path: '/images',
      directory: 'public/images',
    },
    {
      path: '/assets',
      directory: 'public/assets',
    },
  ],
});
```

## Error Handling

Built-in error handling using `HttpException`:

```typescript
app.get('/error', () => {
  throw new HttpException('Something went wrong', 500);
});
```

## Performance Benchmark

**Handling 10,000 concurrent requests:**

- **Average Latency**: 0.58ms
- **Memory Usage**: 0.01 MB

The **ThanhHoa framework** shines with sub-2ms response times and minimal memory usage, making it perfect for high-throughput applications.

_Setup_: Simple GET route (`/test`) over 5,000 iterations, 2 requests per iteration—showcasing its stability and lightweight nature. 🚀✨

## Author

Nguyen Nhu Khanh <kwalker.nnk@gmail.com>

## License

[MIT License](https://github.com/thanhhoajs/thanhhoa?tab=MIT-1-ov-file)
