import { IRequestContext, HttpException } from '@thanhhoajs/thanhhoa';

/**
 * Interface for creating guards
 * @interface IGuard
 */
export interface IGuard {
  /**
   * Method to determine if a request can proceed
   * @param {IRequestContext} context - The request context
   * @returns {Promise<boolean>} True if the request can proceed, false otherwise
   */
  canActivate(context: IRequestContext): Promise<boolean>;
}

/**
 * Decorator to apply guards to route handlers
 * @param {...IGuard[]} guards - List of guards to apply
 * @returns {Function} Decorator function
 */
export function UseGuards(...guards: IGuard[]) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const context = args[0];

      for (const guard of guards) {
        const canActivate = await guard.canActivate(context);
        if (!canActivate) {
          throw new HttpException('Unauthorized', 401);
        }
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
