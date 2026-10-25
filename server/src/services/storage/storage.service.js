import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { ApiError } from '../../utils/ApiError.js';
import { env } from '../../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Memory storage for multer so sharp can process before saving
const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'INVALID_FILE_TYPE', 'Only image uploads are allowed'), false);
    }
  },
});

export async function processAndSaveImage(fileBuffer, originalName = 'photo.jpg') {
  if (!fileBuffer) return null;

  try {
    // Strip EXIF metadata, resize to max 1280x1280, convert to web-optimized JPEG
    const processedBuffer = await sharp(fileBuffer)
      .rotate() // Auto-orient based on EXIF before stripping
      .resize(1280, 1280, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer();

    const filename = `${crypto.randomBytes(16).toString('hex')}.jpg`;

    // If Cloudinary configured in environment
    const cloudName = env.CLOUDINARY_CLOUD_NAME?.replace(/["']/g, '').trim();
    const apiKey = String(env.CLOUDINARY_API_KEY || '').replace(/["']/g, '').trim();
    const apiSecret = env.CLOUDINARY_API_SECRET?.replace(/["']/g, '').trim();

    if (
      cloudName &&
      cloudName !== 'demo' &&
      apiKey &&
      apiKey !== 'demo' &&
      apiSecret &&
      apiSecret !== 'demo'
    ) {
      try {
        const timestamp = Math.floor(Date.now() / 1000);
        const folder = 'haven_reports';
        const stringToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
        const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

        const formData = new FormData();
        const base64Data = `data:image/jpeg;base64,${processedBuffer.toString('base64')}`;
        formData.append('file', base64Data);
        formData.append('api_key', apiKey);
        formData.append('timestamp', timestamp.toString());
        formData.append('folder', folder);
        formData.append('signature', signature);

        const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
        const res = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          return {
            url: data.secure_url,
            publicId: data.public_id,
          };
        } else {
          const errText = await res.text();
          console.warn('Cloudinary upload returned non-200, falling back to local storage:', errText);
        }
      } catch (cldErr) {
        console.warn('Cloudinary upload network error, falling back to local storage:', cldErr.message);
      }
    }

    // Local disk fallback (served via /uploads)
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, processedBuffer);

    return {
      url: `/uploads/${filename}`,
      publicId: filename,
    };
  } catch (err) {
    console.error('Image processing error:', err);
    throw new ApiError(500, 'IMAGE_PROCESSING_FAILED', 'Failed to process image');
  }
}
