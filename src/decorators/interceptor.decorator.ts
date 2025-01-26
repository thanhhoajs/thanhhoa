import { IRequestContext } from '@thanhhoajs/thanhhoa';

/**
 * Interface for creating interceptors
 * @interface IInterceptor
 */
export interface IInterceptor {
  /**
   * Intercept method to handle request/response pipeline
   * @param {IRequestContext} context - The request context
   * @param {Function} next - Function to call the next interceptor or route handler
   * @returns {Promise<Response>} The response object
   */
  intercept(
    context: IRequestContext,
    next: () => Promise<Response>,
  ): Promise<Response>;
}

/**
 * Decorator to apply interceptors to route handlers
 * @param {...IInterceptor[]} interceptors - List of interceptors to apply
 * @returns {Function} Decorator function
 */
export function UseInterceptors(...interceptors: IInterceptor[]) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const context = args[0];
      let index = 0;

      const next = async () => {
        if (index >= interceptors.length) {
          return originalMethod.apply(this, args);
        }
        return interceptors[index++].intercept(context, next);
      };

      return next();
    };

    return descriptor;
  };
}
