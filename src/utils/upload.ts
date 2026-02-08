import { join } from 'path';
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

  // Validate size
  if (file.size > maxSize) {
    throw new Error(`File size exceeds limit of ${maxSize} bytes`);
  }

  // Validate type
  if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed`);
  }

  // Ensure directory exists
  const uploadDir = join(process.cwd(), directory);
  await mkdir(uploadDir, { recursive: true });

  // Generate filename
  let filename = file.name;
  if (!options.preserveName) {
    const ext = file.name.split('.').pop();
    filename = `${randomUUID()}.${ext}`;
  }

  // Save file
  const filePath = join(uploadDir, filename);
  await Bun.write(filePath, file);

  return {
    filename,
    path: filePath,
    size: file.size,
    type: file.type,
  };
}
