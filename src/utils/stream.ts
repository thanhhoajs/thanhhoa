/**
 * Stream utilities with Bun-optimized conversions
 * Uses Bun's native APIs for maximum performance
 */

/**
 * Convert ReadableStream to ArrayBuffer using Bun's native API
 * Much faster than using Response wrapper
 *
 * @example
 * const stream = ctx.stream();
 * const buffer = await streamToArrayBuffer(stream);
 */
export const streamToArrayBuffer = async (
  stream: ReadableStream<Uint8Array>,
): Promise<ArrayBuffer> => {
  return Bun.readableStreamToArrayBuffer(stream);
};

/**
 * Convert ReadableStream to Uint8Array using Bun's native API
 *
 * @example
 * const stream = ctx.stream();
 * const bytes = await streamToBytes(stream);
 */
export const streamToBytes = async (
  stream: ReadableStream<Uint8Array>,
): Promise<Uint8Array> => {
  return Bun.readableStreamToBytes(stream);
};

/**
 * Convert ReadableStream to string using Bun's native API
 *
 * @example
 * const stream = ctx.stream();
 * const text = await streamToText(stream);
 */
export const streamToText = async (
  stream: ReadableStream<Uint8Array>,
): Promise<string> => {
  return Bun.readableStreamToText(stream);
};

/**
 * Convert ReadableStream to JSON using Bun's native API
 *
 * @example
 * const stream = ctx.stream();
 * const data = await streamToJSON<MyType>(stream);
 */
export const streamToJSON = async <T = unknown>(
  stream: ReadableStream<Uint8Array>,
): Promise<T> => {
  return Bun.readableStreamToJSON(stream);
};

/**
 * Convert ReadableStream to Blob using Bun's native API
 *
 * @example
 * const stream = ctx.stream();
 * const blob = await streamToBlob(stream);
 */
export const streamToBlob = async (
  stream: ReadableStream<Uint8Array>,
): Promise<Blob> => {
  return Bun.readableStreamToBlob(stream);
};

/**
 * Convert ReadableStream to array of chunks
 *
 * @example
 * const stream = ctx.stream();
 * const chunks = await streamToArray(stream);
 */
export const streamToArray = async <T = unknown>(
  stream: ReadableStream<T>,
): Promise<T[]> => {
  return Bun.readableStreamToArray(stream);
};

/**
 * Create a direct ReadableStream for zero-copy streaming
 * Uses Bun's optimized direct stream API
 *
 * @example
 * const stream = createDirectStream(async (controller) => {
 *   controller.write("chunk 1");
 *   controller.write("chunk 2");
 * });
 */
export const createDirectStream = (
  pull: (controller: ReadableStreamDirectController) => void | Promise<void>,
): ReadableStream<Uint8Array> => {
  return new ReadableStream({
    type: 'direct',
    pull,
  } as any);
};

/**
 * Create a response from async generator
 * Efficient streaming without buffering
 *
 * @example
 * return streamResponse(async function* () {
 *   yield "data: hello\n\n";
 *   await Bun.sleep(1000);
 *   yield "data: world\n\n";
 * }(), { headers: { 'Content-Type': 'text/event-stream' } });
 */
export const streamResponse = (
  generator: AsyncGenerator<string | Uint8Array>,
  init?: ResponseInit,
): Response => {
  return new Response(generator as any, init);
};

/**
 * Use Bun.ArrayBufferSink for incremental buffer building
 *
 * @example
 * const sink = createBufferSink();
 * sink.write("hello");
 * sink.write(" world");
 * const buffer = sink.end();
 */
export const createBufferSink = (
  options: { highWaterMark?: number; asUint8Array?: boolean } = {},
): Bun.ArrayBufferSink => {
  const sink = new Bun.ArrayBufferSink();
  sink.start({
    highWaterMark: options.highWaterMark ?? 1024 * 16,
    asUint8Array: options.asUint8Array ?? true,
  });
  return sink;
};
