/**
 * Decorator to inject environment variables into class properties
 * @param {string} key - Environment variable key
 * @returns {Function} Property decorator
 */
export function Config(key: string) {
  return function (target: any, propertyKey: string) {
    const envValue = process.env[key];
    Object.defineProperty(target, propertyKey, {
      value: envValue,
      writable: false,
      enumerable: true,
    });
  };
}
