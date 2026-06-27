/**
 * Compresses an image file client-side using canvas.
 * @param {File} file - The original file object.
 * @param {number} maxWidth - Maximum width.
 * @param {number} maxHeight - Maximum height.
 * @param {number} quality - Quality (0 to 1).
 * @returns {Promise<File>} Compressed File object.
 */
export async function compressImage(file, maxWidth = 1200, maxHeight = 1600, quality = 0.75) {
  if (!file || !file.type.startsWith('image/')) {
    return file;
  }
  
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize logic keeping aspect ratio
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file); // fallback to original on failure
              return;
            }
            const compressedFile = new File(
              [blob], 
              file.name.replace(/\.[^/.]+$/, "") + ".jpg", 
              {
                type: 'image/jpeg',
                lastModified: Date.now(),
              }
            );
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}
