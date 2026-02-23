import { expect, test, describe, afterAll } from 'bun:test';
import { uploadFile } from '../../src/utils/upload';
import { rm } from 'fs/promises';
import { join } from 'path';

describe('Upload Utils', () => {
  const uploadDir = 'test-uploads';

  afterAll(async () => {
    try {
      await rm(join(process.cwd(), uploadDir), {
        recursive: true,
        force: true,
      });
    } catch {} // ignore cleanup error
  });

  test('should upload file within limits', async () => {
    const blob = new Blob(['hello world'], { type: 'text/plain' });
    const file = new File([blob], 'test.txt', { type: 'text/plain' });

    const result = await uploadFile(file, { directory: uploadDir });
    expect(result.path).toContain(uploadDir);
    expect(result.size).toBe(11);
    expect(result.type).toContain('text/plain');

    const uploadedContent = await Bun.file(result.path).text();
    expect(uploadedContent).toBe('hello world');
  });

  test('should reject file exceeding max size', async () => {
    const blob = new Blob(['too large'], { type: 'text/plain' });
    const file = new File([blob], 'large.txt', { type: 'text/plain' });

    expect(
      uploadFile(file, { directory: uploadDir, maxSize: 5 }),
    ).rejects.toThrow(/exceeds limit/);
  });

  test('should reject file with an invalid type', async () => {
    const blob = new Blob(['data'], { type: 'application/octet-stream' });
    const file = new File([blob], 'data.bin', {
      type: 'application/octet-stream',
    });

    expect(
      uploadFile(file, { directory: uploadDir, allowedTypes: ['image/png'] }),
    ).rejects.toThrow(/not allowed/);
  });
});
