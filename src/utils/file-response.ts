/**
 * File response utilities
 * Serve files, downloads, and binary data
 */

import { stat } from 'node:fs/promises';
import { extname, basename } from 'node:path';

/**
 * MIME types for common file extensions
 */
const MIME_TYPES: Record<string, string> = {
  // Text
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',

  // Images
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.avif': 'image/avif',

  // Fonts
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',

  // Audio/Video
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.avi': 'video/x-msvideo',

  // Documents
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx':
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.zip': 'application/zip',
  '.rar': 'application/x-rar-compressed',
  '.tar': 'application/x-tar',
  '.gz': 'application/gzip',
  '.7z': 'application/x-7z-compressed',

  // Other
  '.wasm': 'application/wasm',
};

/**
 * Get MIME type from file extension
 */
const getMimeType = (filePath: string): string => {
  const ext = extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
};

interface FileOptions {
  /** Custom filename for Content-Disposition */
  filename?: string;
  /** Force download (attachment) vs inline display */
  download?: boolean;
  /** Custom MIME type */
  contentType?: string;
  /** Cache-Control max-age in seconds */
  maxAge?: number;
  /** Additional headers */
  headers?: Record<string, string>;
}

/**
 * Serve a file from the filesystem
 *
 * @example
 * app.get('/download/:name', async (ctx) => {
 *   return file(`./uploads/${ctx.params.name}`);
 * });
 *
 * // Force download
 * app.get('/export', async () => {
 *   return file('./data.csv', { download: true, filename: 'export.csv' });
 * });
 */
export const file = async (
  path: string,
  options: FileOptions = {},
): Promise<Response> => {
  const {
    filename,
    download = false,
    contentType,
    maxAge = 0,
    headers: customHeaders = {},
  } = options;

  try {
    const bunFile = Bun.file(path);
    const exists = await bunFile.exists();

    if (!exists) {
      return new Response('File not found', { status: 404 });
    }

    const fileStats = await stat(path);
    const mimeType = contentType || getMimeType(path);
    const displayName = filename || basename(path);

    const headers: Record<string, string> = {
      'Content-Type': mimeType,
      'Content-Length': fileStats.size.toString(),
      'Last-Modified': fileStats.mtime.toUTCString(),
      ...customHeaders,
    };

    // Cache control
    if (maxAge > 0) {
      headers['Cache-Control'] = `public, max-age=${maxAge}`;
    }

    // Content-Disposition for downloads
    if (download) {
      headers['Content-Disposition'] =
        `attachment; filename="${encodeURIComponent(displayName)}"`;
    } else {
      headers['Content-Disposition'] =
        `inline; filename="${encodeURIComponent(displayName)}"`;
    }

    return new Response(bunFile, { headers });
  } catch (error) {
    console.error('File serve error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};

/**
 * Force file download (shorthand for file with download: true)
 *
 * @example
 * app.get('/export', async () => {
 *   return attachment('./report.pdf', 'monthly-report.pdf');
 * });
 */
export const attachment = async (
  path: string,
  filename?: string,
  options: Omit<FileOptions, 'download' | 'filename'> = {},
): Promise<Response> => {
  return file(path, { ...options, download: true, filename });
};

/**
 * Create a binary blob response
 *
 * @example
 * app.get('/image', () => {
 *   const buffer = generateImage();
 *   return blob(buffer, 'image/png');
 * });
 */
export const blob = (
  data: ArrayBuffer | Blob,
  contentType: string = 'application/octet-stream',
  headers?: Record<string, string>,
): Response => {
  return new Response(data, {
    headers: {
      'Content-Type': contentType,
      ...headers,
    },
  });
};

/**
 * Create an inline file response (display in browser)
 *
 * @example
 * app.get('/preview/:id', async (ctx) => {
 *   const pdfPath = await getPdfPath(ctx.params.id);
 *   return inline(pdfPath);
 * });
 */
export const inline = async (
  path: string,
  options: Omit<FileOptions, 'download'> = {},
): Promise<Response> => {
  return file(path, { ...options, download: false });
};
