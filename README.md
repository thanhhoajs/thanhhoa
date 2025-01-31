<p align="center">
  <img src="https://drive.google.com/uc?export=view&id=1_M5tYoaKfXpqsOAPQl3WVWs9u5NWrG76" alt="ThanhHoa Logo" width="300"/>
</p>

# @thanhhoajs/thanhhoa

ThanhHoa is a high-performance, lightweight web framework for Bun, designed to simplify server-side development while delivering maximum speed and efficiency. Built with TypeScript, ThanhHoa provides a robust and type-safe environment for building modern web applications.

## Features

- 🚀 **Built for Speed**: Leverages Bun's non-blocking I/O for ultra-fast request processing.
- 🧩 **Modular Design**: Simple and flexible middleware system for extending functionality.
- 🛣️ **Intuitive Routing**: Supports dynamic routes, parameters, and multiple HTTP methods.
- 🎛️ **Full HTTP Support**: Handles GET, POST, PUT, PATCH, and DELETE methods seamlessly.
- 🔒 **Standardized Error Handling**: Built-in `HttpException` for structured error responses.
- 🎭 **TypeScript Support**: Fully typed for a streamlined and type-safe developer experience.
- 🗄️ **Built-in Caching**: URL caching for optimized performance and reduced latency.
- ⏱️ **Request Timeout**: Configurable timeout for managing long-running requests.
- 🌐 **CORS Middleware**: Flexible configuration for Cross-Origin Resource Sharing (CORS) and security headers.
- 🛡️ **Helmet Middleware**: Enhanced HTTP security headers for protecting your application.
- 📈 **Rate Limiting**: Middleware for managing request rates from clients to prevent abuse.
- 🗜️ **Response Compression**: Gzip compression middleware to reduce response size and improve performance.
- 🗂️ **Custom Static Directories**: Supports multiple static directories for organized file management.
- 📚 **Swagger Integration**: Easy setup for API documentation with Swagger UI.

## Installation

Install ThanhHoa using Bun:

```bash
bun add @thanhhoajs/thanhhoa
```

## Quick Start

Here’s a quick example to get started with ThanhHoa:

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

Run your application:

```bash
bun run app.ts
```

Visit `http://localhost:3000` to see "Hello, ThanhHoa!" in your browser.

## Routing

ThanhHoa provides flexible routing with support for dynamic parameters and multiple HTTP methods:

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

ThanhHoa allows you to add middleware globally or for specific routes. Middleware can be used for logging, authentication, CORS, rate limiting, and more:

```typescript
// Custom middleware for logging
const logger = async (ctx: IRequestContext, next: INextFunction) => {
  console.log(`${ctx.request.method} ${ctx.request.url}`);
  return next();
};

// Adding middleware
app.use(logger);
app.use(corsMiddleware());
app.use(helmetMiddleware());
app.use(rateLimiter({ windowMs: 60000, maxRequests: 100 }));
app.use(cacheMiddleware());
app.use(compression());

// Protected route with custom middleware
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

ThanhHoa provides built-in error handling using `HttpException` for structured error responses:

```typescript
app.get('/error', () => {
  throw new HttpException('Something went wrong', 500);
});
```

## Swagger Integration

ThanhHoa makes it easy to set up API documentation using Swagger UI:

```typescript
// swagger-options.ts
import type { Options } from 'swagger-jsdoc';

const currentDir = process.cwd();

export const swaggerOptions: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ThanhHoa API',
      version: '1.0.0',
      description: 'API documentation for ThanhHoa app',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: [`${currentDir}/src/modules/**/*.controller.ts`],
};

// swagger-spec.ts
import swaggerJSDoc from 'swagger-jsdoc';

import { swaggerOptions } from './swagger-options';

export const swaggerSpec = swaggerJSDoc(swaggerOptions);

// main.ts
import {
  cacheMiddleware,
  compression,
  corsMiddleware,
  helmetMiddleware,
  type INextFunction,
  type IRequestContext,
  rateLimiter,
  setupSwagger,
  ThanhHoa,
} from '@thanhhoajs/thanhhoa';

import { swaggerSpec } from './common/swagger/swagger-spec';
import { runValidators } from './configs';
import { appConfig } from './configs/app.config';
import { AppModule } from './modules/app.module';

// Set the timezone to UTC
process.env.TZ = 'Etc/Universal';
const docsRoute = '/docs';
const prefix = '/api';

runValidators();

export async function startServer() {
  const app = new ThanhHoa(prefix);

  new AppModule(app);

  const applyMiddlewareIfNeeded = (
    middleware: any,
    context: IRequestContext,
    next: INextFunction,
  ) => {
    if (!context.request.url.includes(docsRoute)) {
      return middleware()(context, next);
    }
    return next();
  };

  app.use((context, next) =>
    applyMiddlewareIfNeeded(corsMiddleware, context, next),
  );
  app.use((context, next) =>
    applyMiddlewareIfNeeded(helmetMiddleware, context, next),
  );
  app.use((context, next) =>
    applyMiddlewareIfNeeded(cacheMiddleware, context, next),
  );
  app.use(
    await rateLimiter({
      windowMs: 300000, // 5 minutes
      maxRequests: 50, // 50 requests
      message: 'Too many requests, please try again later',
      skipFailedRequests: false,
      skipSuccessfulRequests: false,
    }),
  );
  app.use(
    compression({
      level: 1,
      library: 'zlib',
      memLevel: 9,
      windowBits: 9,
      strategy: 0,
    }),
  );

  setupSwagger(app, docsRoute, swaggerSpec);

  app.listen({
    port: appConfig.port || 3000,
    development: false,
    reusePort: true, // Enable cluster mode
    staticDirectories: [
      {
        path: '/assets',
        directory: 'public/assets',
      },
    ],
  });
}

void startServer();
```

Visit `http://localhost:3000/api/docs` to see the Swagger UI.

## Performance Benchmark

**Handling 10,000 concurrent requests:**

- **Average Latency**: 0.57ms
- **Memory Usage**: 0.01 MB

ThanhHoa is designed for high-throughput applications, offering sub-1ms response times and minimal memory usage.

_Setup_: Simple GET route (`/test`) over 5,000 iterations, 2 requests per iteration—showcasing its stability and lightweight nature. 🚀✨

## Author

Nguyen Nhu Khanh <kwalker.nnk@gmail.com>

## License

[MIT License](https://github.com/thanhhoajs/thanhhoa?tab=MIT-1-ov-file)
