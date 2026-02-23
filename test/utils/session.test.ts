import { expect, test, describe } from 'bun:test';
import { MemorySessionStore, sessionManager } from '../../src/utils/session';

describe('Session Manager with MemoryStore', () => {
  test('should create, get, update, and destroy sessions', async () => {
    const store = new MemorySessionStore();
    const sessionOpts = sessionManager(store, { ttl: 60 });

    const sessionId = await sessionOpts.create({ user: 'foo' });
    expect(typeof sessionId).toBe('string');

    let data = await sessionOpts.get(sessionId);
    expect(data).toEqual({ user: 'foo' });

    await sessionOpts.update(sessionId, { user: 'bar', age: 30 });
    data = await sessionOpts.get(sessionId);
    expect(data).toEqual({ user: 'bar', age: 30 });

    await sessionOpts.destroy(sessionId);
    data = await sessionOpts.get(sessionId);
    expect(data).toBeNull();
  });

  test('should expire session in memory store', async () => {
    const store = new MemorySessionStore();
    const sessionOpts = sessionManager(store, { ttl: 0.05 }); // 50ms TTL

    const sid = await sessionOpts.create({ foo: 'bar' });
    expect(await sessionOpts.get(sid)).toBeTruthy();

    await Bun.sleep(60);
    expect(await sessionOpts.get(sid)).toBeNull();
  });

  test('should handle missing session ID gracefully', async () => {
    const store = new MemorySessionStore();
    const sessionOpts = sessionManager(store);

    expect(await sessionOpts.get('')).toBeNull();
  });
});
