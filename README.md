<p align="center">
  <img src="https://drive.google.com/uc?export=view&id=1_M5tYoaKfXpqsOAPQl3WVWs9u5NWrG76" alt="ThanhHoa Logo" width="300"/>
</p>

# @thanhhoajs/thanhhoa

ThanhHoa is a lightweight, high-performance web framework for Bun, designed to make server-side development simple and enjoyable.

## Features

- 🚀 **Built for speed**: Leverages Bun's performance for lightning-fast request handling.
- 🧩 **Modular**: Easy-to-use middleware system.
- 🛣️ **Intuitive routing**: Support for parameters.
- 🎛️ **Flexible**: Supports various HTTP methods (GET, POST, PUT, PATCH, DELETE).
- 🔒 **Built-in error handling**: Comes with `HttpException` for standardized error responses.
- 🎭 **TypeScript support**: Written in TypeScript for better developer experience.
- 🗄️ **Caching**: Built-in URL caching for optimized performance.
- ⏱️ **Request Timeout**: Configurable request timeout to handle long-running requests.
- 🧹 **Automatic Cache Cleanup**: Periodic cleanup of stale cache entries.
- 🌐 **CORS Middleware**: Comprehensive CORS and security headers configuration.
- 🛡️ **Helmet Middleware**: Enhanced security headers for HTTP requests.
- 📈 **Rate Limiting**: Middleware to limit the number of requests from the same client.
- 🗜️ **Compression Middleware**: Gzip compression for response bodies.

## Installation

```bash
bun add @thanhhoajs/thanhhoa
```

## Quick Start

Here's a simple example to get you started:

```typescript
import { ThanhHoa, type IRequestContext } from '@thanhhoajs/thanhhoa';

const app = new ThanhHoa();

app.get('/', (ctx: IRequestContext) => {
  return new Response('Hello, ThanhHoa!', {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
});

app.listen({ port: 3000 });
```

Run your app:

```bash
bun run app.ts
```

Visit `http://localhost:3000` in your browser to see "Hello, ThanhHoa!".

## Routing

ThanhHoa supports various HTTP methods and route parameters:

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

Add middleware to your application or specific routes:

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

## Error Handling

ThanhHoa provides built-in error handling with HttpException:

```typescript
app.get('/error', () => {
  throw new HttpException('Something went wrong', 500);
});
```

## Author

Nguyen Nhu Khanh <kwalker.nnk@gmail.com>

## License

[MIT License](https://github.com/thanhhoajs/thanhhoa?tab=MIT-1-ov-file)
