<p align="center">
  <img src="https://drive.google.com/uc?export=view&id=1_M5tYoaKfXpqsOAPQl3WVWs9u5NWrG76" alt="ThanhHoa Logo" width="300"/>
</p>

# @thanhhoajs/thanhhoa

ThanhHoa is a lightweight, high-performance web framework for Bun, designed to make server-side development simple and enjoyable.

[![npm version](https://badge.fury.io/js/@thanhhoajs%2Fthanhhoa.svg)](https://badge.fury.io/js/@thanhhoajs%2Fthanhhoa)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🚀 Built for speed: Leverages Bun's performance for lightning-fast request handling
- 🧩 Modular: Easy-to-use middleware system
- 🛣️ Intuitive routing: Support for parameters
- 🎛️ Flexible: Supports various HTTP methods (GET, POST, PUT, PATCH, DELETE)
- 🔒 Built-in error handling: Comes with HttpException for standardized error responses
- 🎭 TypeScript support: Written in TypeScript for better developer experience

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
  return new Response('Hello, ThanhHoa!');
});

app.listen({ port: 3000 });
```

Run your app:

```bash
bun run your-app.ts
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
