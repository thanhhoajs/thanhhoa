import { expect, test, describe } from 'bun:test';
import {
  streamToArrayBuffer,
  streamToText,
  streamToJSON,
  streamToArray,
} from '../../src/utils/stream';

describe('Stream Utils', () => {
  test('streamToArrayBuffer', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2, 3]));
        controller.close();
      },
    });
    const buffer = await streamToArrayBuffer(stream);
    expect(buffer).toBeInstanceOf(ArrayBuffer);
    expect(new Uint8Array(buffer)).toEqual(new Uint8Array([1, 2, 3]));
  });

  test('streamToText', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('hello'));
        controller.close();
      },
    });
    const text = await streamToText(stream);
    expect(text).toBe('hello');
  });

  test('streamToJSON', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(JSON.stringify({ a: 1 })));
        controller.close();
      },
    });
    const json = await streamToJSON(stream);
    expect(json).toEqual({ a: 1 });
  });

  test('streamToArray', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue('chunk1');
        controller.enqueue('chunk2');
        controller.close();
      },
    });
    const arr = await streamToArray(stream);
    expect(arr).toEqual(['chunk1', 'chunk2']);
  });
});
