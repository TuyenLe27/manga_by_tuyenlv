import fs from 'fs/promises';
import path from 'path';

/**
 * Uploads an image buffer to ImgBB and returns the direct CDN URL.
 */
async function uploadToImgBB(buffer, fileName, apiKey) {
  const base64 = buffer.toString('base64');
  const formData = new FormData();
  formData.append('image', base64);
  formData.append('name', fileName);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`ImgBB API responded with ${response.status}: ${errText}`);
  }

  const resData = await response.json();
  if (!resData.success) {
    throw new Error(resData.error?.message || 'ImgBB upload failed');
  }

  return resData.data.url;
}

/**
 * Saves a File object to the public uploads folder.
 * @param {File} file - The file from Request formData
 * @param {string} subDir - Relative directory inside public/uploads, e.g. "comics" or "comics/<id>/chapters/<id>"
 * @param {string} fileName - Optional filename. If omitted, a timestamp + clean original name will be used.
 * @returns {Promise<string>} The public URL path (e.g. "/uploads/comics/filename.png" or "https://i.ibb.co/...")
 */
export async function saveUploadedFile(file, subDir, fileName) {
  if (!file) throw new Error("No file provided");

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const finalName = fileName || `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

  // 1. Try uploading to ImgBB first if API Key is configured in environment
  const imgbbKey = process.env.IMGBB_API_KEY;
  if (imgbbKey) {
    try {
      console.log(`Uploading ${finalName} to ImgBB CDN...`);
      const url = await uploadToImgBB(buffer, finalName, imgbbKey);
      console.log(`Uploaded to ImgBB successfully: ${url}`);
      return url;
    } catch (error) {
      console.error("ImgBB upload failed, falling back to local/base64:", error.message);
    }
  }

  // 2. Local filesystem write
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', subDir);

  try {
    await fs.mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, finalName);
    await fs.writeFile(filePath, buffer);
    // Public path that Next.js serves statically
    return `/uploads/${subDir}/${finalName}`;
  } catch (error) {
    console.warn("Read-only filesystem detected or write failed. Falling back to Base64 data URI.", error.message);
    const mimeType = file.type || 'image/png';
    const base64 = buffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
  }
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
