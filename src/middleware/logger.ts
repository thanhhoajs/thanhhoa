import { Logger } from '@thanhhoajs/logger';
import type { Middleware } from '../shared/types';

interface LoggerOptions {
  name?: string;
  level?: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Logger middleware to log HTTP requests
 */
export const logger = (options: LoggerOptions = {}): Middleware => {
  const log = Logger.get(options.name || 'HTTP');
  const level = options.level || 'info';

  return async (ctx, next) => {
    const start = performance.now();
    const { method, url } = ctx.request;

    try {
      const response = await next();
      const duration = (performance.now() - start).toFixed(2);
      const status = response.status;
      const msg = `${method} ${url} ${status} - ${duration}ms`;

      if (status >= 500) {
        log.error(msg);
      } else if (status >= 400) {
        log.warn(msg);
      } else {
        log[level](msg);
      }

      return response;
    } catch (error) {
      const duration = (performance.now() - start).toFixed(2);
      log.error(`${method} ${url} 500 - ${duration}ms - Error: ${error}`);
      throw error;
    }
  };
};
