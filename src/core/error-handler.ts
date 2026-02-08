import type { IRequestContext } from '../shared/interfaces';

/**
 * Interface for global error handling
 */
export interface IErrorHandler {
  handle(error: unknown, ctx: IRequestContext): Response | Promise<Response>;
}

/**
 * Default error handler implementation
 * Returns JSON response with error details in development mode
 */
export class DefaultErrorHandler implements IErrorHandler {
  handle(error: unknown, ctx: IRequestContext): Response {
    const isProduction = process.env.NODE_ENV === 'production';

    // Log the error
    console.error(`[Error] ${ctx.request.method} ${ctx.request.url}:`, error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: isProduction ? 'Something went wrong' : errorMessage,
        stack: isProduction ? undefined : errorStack,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }
}
