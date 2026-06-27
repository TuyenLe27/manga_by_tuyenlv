import fs from 'fs/promises';
import path from 'path';

/**
 * Saves a File object to the public uploads folder.
 * @param {File} file - The file from Request formData
 * @param {string} subDir - Relative directory inside public/uploads, e.g. "comics" or "comics/<id>/chapters/<id>"
 * @param {string} fileName - Optional filename. If omitted, a timestamp + clean original name will be used.
 * @returns {Promise<string>} The public URL path (e.g. "/uploads/comics/filename.png")
 */
export async function saveUploadedFile(file, subDir, fileName) {
  if (!file) throw new Error("No file provided");

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Directory: public/uploads/<subDir>
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', subDir);
  await fs.mkdir(uploadDir, { recursive: true });

  const finalName = fileName || `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const filePath = path.join(uploadDir, finalName);
  await fs.writeFile(filePath, buffer);

  // Public path that Next.js serves statically
  return `/uploads/${subDir}/${finalName}`;
}

/**
 * Deletes a file or directory recursively if it exists.
 * @param {string} relativePath - The path relative to public/uploads, e.g. "comics/<id>"
 */
export async function deleteUploadedPath(relativePath) {
  if (!relativePath) return;
  // Clean path to prevent path traversal
  const cleanRelative = path.normalize(relativePath).replace(/^(\.\.(\/|\\))+/, '');
  const absolutePath = path.join(process.cwd(), 'public', 'uploads', cleanRelative);

  try {
    const stats = await fs.stat(absolutePath);
    if (stats.isDirectory()) {
      await fs.rm(absolutePath, { recursive: true, force: true });
    } else {
      await fs.unlink(absolutePath);
    }
  } catch (error) {
    // If file doesn't exist, ignore
    if (error.code !== 'ENOENT') {
      console.error(`Failed to delete path: ${absolutePath}`, error);
    }
  }
}
