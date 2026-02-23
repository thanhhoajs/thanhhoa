import { join, basename, extname } from 'path';
import { mkdir } from 'fs/promises';
import { randomUUID } from 'crypto';

interface UploadOptions {
  directory?: string;
  maxSize?: number; // bytes
  allowedTypes?: string[]; // mime types
  preserveName?: boolean;
}

interface UploadResult {
  filename: string;
  path: string;
  size: number;
  type: string;
}

/**
 * Utility to save uploaded files from FormData
 */
export async function uploadFile(
  file: File,
  options: UploadOptions = {},
): Promise<UploadResult> {
  const directory = options.directory || 'uploads';
  const maxSize = options.maxSize || 5 * 1024 * 1024; // 5MB default

  if (file.size > maxSize) {
    throw new Error(`File size exceeds limit of ${maxSize} bytes`);
  }

  if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed`);
  }

  const uploadDir = join(process.cwd(), directory);
  await mkdir(uploadDir, { recursive: true });

  const safeName = basename(file.name);
  let filename: string;
  if (!options.preserveName) {
    const ext = extname(safeName) || '';
    filename = `${randomUUID()}${ext}`;
  } else {
    filename = safeName;
  }

  const filePath = join(uploadDir, filename);
  await Bun.write(filePath, file);

  return {
    filename,
    path: filePath,
    size: file.size,
    type: file.type,
  };
}
