/**
 * Redis connection utility
 * Implements Singleton pattern to ensure a single connection instance is reused
 */

let redisInstance: any = null;

/**
 * Get or create a Redis client instance (Singleton)
 * Uses 'ioredis' if available
 *
 * @param options Connection options for ioredis
 * @returns Promise<Redis client>
 */
export const getRedisClient = async (options?: any): Promise<any> => {
  if (redisInstance) {
    return redisInstance;
  }

  try {
    // Try to import ioredis dynamically
    // @ts-ignore
    const { default: Redis } = await import('ioredis');
    redisInstance = new Redis(options);
    return redisInstance;
  } catch (error) {
    throw new Error(
      'Please install "ioredis" to use Redis connection management: bun add ioredis',
    );
  }
};

/**
 * Setter to manually inject a redis client (for testing or custom clients)
 */
export const setRedisClient = (client: any) => {
  redisInstance = client;
};

/**
 * Close the shared Redis connection
 */
export const closeRedisConnection = async (): Promise<void> => {
  if (redisInstance) {
    if (typeof redisInstance.quit === 'function') {
      await redisInstance.quit();
    } else if (typeof redisInstance.disconnect === 'function') {
      redisInstance.disconnect();
    }
    redisInstance = null;
  }
};
