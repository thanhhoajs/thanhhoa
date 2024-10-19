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

## Integrating Swagger Documentation

This guide will help you set up Swagger documentation for your ThanhHoa application. With Swagger, you can easily document your API endpoints and visualize them through a user-friendly interface.

### Prerequisites

- Ensure you have the ThanhHoa framework set up in your project.
- Install the `swagger-jsdoc` package to generate Swagger documentation.

```bash
bun add swagger-jsdoc
```

### Step 1: Define Swagger Options

Create a file named `swagger-options.ts` to define your Swagger options, including API title, version, description, and the path to your API files.

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
      description: 'API documentation for ThanhHoa framework',
    },
    servers: [
      {
        url: 'http://localhost:3000', // Update if your server runs on a different port
      },
    ],
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
  apis: [`${currentDir}/example/src/modules/**/*.module.ts`], // Adjust this path to your API modules
};
```

### Step 2: Generate Swagger Specification

Create a file named `swagger-spec.ts` to generate the Swagger specification using the defined options.

```typescript
// swagger-spec.ts
import swaggerJSDoc from 'swagger-jsdoc';

import { swaggerOptions } from './swagger-options';

export const swaggerSpec = swaggerJSDoc(swaggerOptions);
```

### Step 3: Setup Swagger in Your Application

In your main application file, set up Swagger routes using the utility function `setupSwagger`. Here's how to do it:

```typescript
import {
  ThanhHoa,
  type IRequestContext,
  corsMiddleware,
  helmetMiddleware,
  setupSwagger,
} from '@thanhhoajs/thanhhoa';

import { AppModule } from './src/modules/app.module';
import { swaggerSpec } from './src/swagger/swagger-spec';

const docsRoute = '/api/docs'; // Define your documentation route

const app = new ThanhHoa();

new AppModule(app);

app.use(corsMiddleware());
app.use((context, next) => {
  // Apply helmet middleware only for non-docs requests
  if (!context.request.url.includes(docsRoute)) {
    return helmetMiddleware()(context, next);
  }
  return next();
});

// Setup Swagger routes
setupSwagger(app, docsRoute, swaggerSpec);

app.listen({ port: 3000, development: true });
```

### Step 4: Document Your API Endpoints

In your modules, use Swagger annotations to document your API endpoints. Here’s an example of how to document the login and registration endpoints in the `AuthModule`:

```typescript
// auth.module.ts
import type { IRequestContext, ThanhHoa } from '@thanhhoajs/thanhhoa';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';

export class AuthModule {
  constructor(app: ThanhHoa) {
    const userService = new UserService();
    const authService = new AuthService(userService);
    const authController = new AuthController(authService);

    /**
     * @swagger
     * paths:
     *   /auth/login:
     *     post:
     *       tags:
     *         - Auth
     *       summary: Login
     *       description: Login to the application
     *       requestBody:
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 email:
     *                   type: string
     *                   format: email
     *                   default: user@example.com
     *                 password:
     *                   type: string
     *                   default: password
     *       responses:
     *         200:
     *           description: Successful login
     *           content:
     *             application/json:
     *               schema:
     *                 type: object
     *                 properties:
     *                   token:
     *                     type: string
     *         401:
     *           description: Unauthorized
     *           content:
     *             application/json:
     *               schema:
     *                 type: object
     *                 properties:
     *                   error:
     *                     type: string
     *         500:
     *           description: Internal server error
     *           content:
     *             application/json:
     *               schema:
     *                 type: object
     *                 properties:
     *                   error:
     *                     type: string
     * */
    app.post('/auth/login', (context: IRequestContext) =>
      authController.login(context),
    );

    // Add more routes as needed
  }
}
```

### Accessing Swagger Documentation

After setting up everything, you can access your API documentation by navigating to:

```
http://localhost:3000/api/docs
```

This will display the Swagger UI, where you can see all your API endpoints and test them directly from the browser.

## Author

Nguyen Nhu Khanh <kwalker.nnk@gmail.com>

## License

[MIT License](https://github.com/thanhhoajs/thanhhoa?tab=MIT-1-ov-file)
