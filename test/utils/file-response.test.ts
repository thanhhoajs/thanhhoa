import { expect, test, describe, beforeAll, afterAll } from 'bun:test';
import { file, attachment, blob, inline } from '../../src/utils/file-response';
import { join } from 'path';

describe('File Response Utils', () => {
  const testFileName = 'dummy-file-response.txt';
  const testFilePath = join(process.cwd(), testFileName);

  beforeAll(async () => {
    await Bun.write(testFilePath, 'dummy content');
  });

  afterAll(async () => {
    const f = Bun.file(testFilePath);
    if (await f.exists()) {
      await f.delete();
    }
  });

  test('file() should serve file', async () => {
    const res = await file(testFilePath);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/plain');
    expect(await res.text()).toBe('dummy content');
  });

  test('attachment() should set Content-Disposition to attachment', async () => {
    const res = await attachment(testFilePath, 'custom-name.txt');
    expect(res.headers.get('content-disposition')).toContain('attachment');
    expect(res.headers.get('content-disposition')).toContain('custom-name.txt');
  });

  test('inline() should set Content-Disposition to inline', async () => {
    const res = await inline(testFilePath);
    expect(res.headers.get('content-disposition')).toContain('inline');
  });

  test('blob() should return valid blob response', async () => {
    const b = new Blob(['blob data'], { type: 'application/octet-stream' });
    const res = blob(b, 'application/custom');
    expect(res.headers.get('content-type')).toBe('application/custom');
    expect(await res.text()).toBe('blob data');
  });

  test('file() should return 404 for missing file', async () => {
    const res = await file('non-existent-file.xyz');
    expect(res.status).toBe(404);
  });
});
