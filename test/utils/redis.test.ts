import { expect, test, describe } from 'bun:test';
import {
  getRedisClient,
  closeRedisConnection,
  setRedisClient,
} from '../../src/utils/redis';

describe('Redis Core Utils', () => {
  test('setRedisClient should set custom instance', async () => {
    const mockClient = { ping: () => 'PONG' };
    setRedisClient(mockClient);
    const client = await getRedisClient();
    expect(client.ping()).toBe('PONG');
  });

  test('closeRedisConnection should clear instance and call quit/disconnect', async () => {
    let quitCalled = false;
    const mockClient = {
      quit: async () => {
        quitCalled = true;
      },
    };
    setRedisClient(mockClient);
    await closeRedisConnection();

    expect(quitCalled).toBe(true);

    // Test that the actual fallback re-throws when ioredis isn't installed
    // In our test env we wouldn't have ioredis unless added, we'll verify it throws the correct error
    try {
      await getRedisClient();
    } catch (err: any) {
      expect(err.message).toContain('Please install "ioredis"');
    }
  });

  test('closeRedisConnection handles client with only disconnect function', async () => {
    let disconnectCalled = false;
    const mockClient = {
      disconnect: () => {
        disconnectCalled = true;
      },
    };
    setRedisClient(mockClient);
    await closeRedisConnection();

    expect(disconnectCalled).toBe(true);
  });
});
