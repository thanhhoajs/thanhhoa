import { expect, test, describe } from 'bun:test';
import {
  json,
  text,
  html,
  redirect,
  noContent,
  stream,
  sse,
} from '../../src/utils/response.utils';

describe('Response Utils', () => {
  test('json() creates JSON response', async () => {
    const res = json({ hello: 'world' });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe(
      'application/json; charset=utf-8',
    );
    expect(await res.json()).toEqual({ hello: 'world' });
  });

  test('text() creates plain text response', async () => {
    const res = text('hello');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/plain; charset=utf-8');
    expect(await res.text()).toBe('hello');
  });

  test('html() creates HTML response', async () => {
    const res = html('<h1>Hello</h1>');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/html; charset=utf-8');
    expect(await res.text()).toBe('<h1>Hello</h1>');
  });

  test('redirect() returns 302 response with Location header', () => {
    const res = redirect('/login');
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('/login');
  });

  test('redirect() returns custom status code', () => {
    const res = redirect('/dashboard', 301);
    expect(res.status).toBe(301);
  });

  test('noContent() creates 204 response', () => {
    const res = noContent();
    expect(res.status).toBe(204);
  });
});
