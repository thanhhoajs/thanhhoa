import { IRequestContext, container } from '@thanhhoajs/thanhhoa';

export const CONTROLLER_METADATA_KEY = 'controller';
export const ROUTE_METADATA_KEY = 'route';
export const INJECT_METADATA_KEY = 'inject';
export const MODULE_METADATA_KEY = 'module';
export const SERVICE_METADATA_KEY = 'provider';

/**
 * Type definition for decorator context
 */
type DecoratorContext =
  | ClassMethodDecoratorContext
  | {
      kind: string;
      name: string | symbol;
      access: { get: () => any };
    };

/**
 * Type definition for legacy method decorator
 */
type MethodDecorator = (
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor,
) => PropertyDescriptor | void;

/**
 * Type definition for new method decorator (Stage 3)
 */
type NewMethodDecorator = (
  target: ClassMethodDecoratorContext,
) => ((context: IRequestContext) => Promise<Response>) | void;

/**
 * Base constructor type
 * @template T - Type of the constructed instance
 */
export type Constructor<T = any> = new (...args: any[]) => T;

/**
 * Provider configuration interface
 */
export interface ProviderConfig {
  provide: string;
  useClass?: Constructor;
  useFactory?: () => any;
  useValue?: any;
}

/**
 * Service type can be either a constructor or provider config
 */
export type ServiceType = Constructor | ProviderConfig;

/**
 * Controller class type definition
 */
export type ControllerType = Constructor & { name: string };

/**
 * Module class type definition
 */
export type ModuleType = Constructor & { name: string };

/**
 * Module metadata interface
 */
export interface ModuleMetadata {
  imports?: ModuleType[];
  providers?: ServiceType[];
  controllers?: ControllerType[];
  exports?: ServiceType[];
}

/**
 * Creates a method decorator for HTTP methods
 * @param method - HTTP method
 * @param path - Route path
 */
function createMethodDecorator(method: string, path: string = '') {
  return function decorateMethod(target: any, context?: DecoratorContext) {
    // Stage 3 decorator
    if (context?.kind === 'method') {
      const methodName = String(context.name);
      Reflect.defineMetadata(
        ROUTE_METADATA_KEY,
        { path, method },
        target,
        methodName,
      );
      return;
    }

    // Legacy decorator
    if (typeof target === 'object') {
      const propertyKey = String(context);
      Reflect.defineMetadata(
        ROUTE_METADATA_KEY,
        { path, method },
        target,
        propertyKey,
      );
      return;
    }
  } as MethodDecorator & NewMethodDecorator;
}

/**
 * Decorator for marking a class as a controller
 * @param path - Base path for the controller
 */
export function Controller(path: string = '') {
  return function (target: any): void {
    Reflect.defineMetadata(CONTROLLER_METADATA_KEY, path, target);
  };
}

/**
 * HTTP GET method decorator
 * @param path - Route path
 */
export const Get = (path: string = '') => createMethodDecorator('GET', path);

/**
 * HTTP POST method decorator
 * @param path - Route path
 */
export const Post = (path: string = '') => createMethodDecorator('POST', path);

/**
 * HTTP PUT method decorator
 * @param path - Route path
 */
export const Put = (path: string = '') => createMethodDecorator('PUT', path);

/**
 * HTTP PATCH method decorator
 * @param path - Route path
 */
export const Patch = (path: string = '') =>
  createMethodDecorator('PATCH', path);

/**
 * HTTP DELETE method decorator
 * @param path - Route path
 */
export const Delete = (path: string = '') =>
  createMethodDecorator('DELETE', path);

/**
 * Dependency injection decorator
 * @param token - Injection token
 */
export function Inject(token: string) {
  return function (
    target: any,
    propertyKey: string | undefined,
    parameterIndex: number,
  ) {
    // For constructor parameters
    if (!propertyKey) {
      // Get existing metadata or initialize new array
      const existingParams: (string | null)[] =
        Reflect.getMetadata(INJECT_METADATA_KEY, target, 'constructor') ||
        Reflect.getMetadata(
          INJECT_METADATA_KEY,
          target.prototype,
          'constructor',
        ) ||
        [];

      // Ensure array is large enough for the parameter index
      while (existingParams.length <= parameterIndex) {
        existingParams.push(null); // Changed from undefined to null
      }

      // Set the injection token at the correct index
      existingParams[parameterIndex] = token;

      // Store on both prototype and constructor to ensure availability
      if (typeof target === 'function') {
        // Class decorator
        Reflect.defineMetadata(INJECT_METADATA_KEY, existingParams, target);
        Reflect.defineMetadata(
          INJECT_METADATA_KEY,
          existingParams,
          target.prototype,
          'constructor',
        );
      } else {
        // Parameter decorator
        Reflect.defineMetadata(
          INJECT_METADATA_KEY,
          existingParams,
          target,
          'constructor',
        );
        Reflect.defineMetadata(
          INJECT_METADATA_KEY,
          existingParams,
          target.constructor,
        );
      }
    } else {
      // For method parameters
      const existingParams: string[] =
        Reflect.getMetadata(INJECT_METADATA_KEY, target, propertyKey) || [];
      existingParams[parameterIndex] = token;
      Reflect.defineMetadata(
        INJECT_METADATA_KEY,
        existingParams,
        target,
        propertyKey,
      );
    }
  };
}

/**
 * Module decorator for defining module configuration
 * @param metadata - Module configuration metadata
 */
export function Module(metadata: ModuleMetadata) {
  return function (target: any) {
    Reflect.defineMetadata(MODULE_METADATA_KEY, metadata, target);

    // Register the module class in the container
    if (!container.has(target.name)) {
      container.register(target.name, target);
    }
  };
}

/**
 * Provider decorator for marking a class as a service provider
 */
export function Provider(
  options: { singleton?: boolean; token?: string } = {},
) {
  return function (target: any) {
    const token = options.token || target.name;
    Reflect.defineMetadata(
      SERVICE_METADATA_KEY,
      {
        singleton: options.singleton,
        token,
      },
      target,
    );

    if (!container.has(token)) {
      container.register(token, target, { singleton: options.singleton });
    }
  };
}

// Factory provider support
export function Factory(factory: () => any) {
  return function (target: any) {
    const token = target.name;
    container.register(token, factory());
  };
}
