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

    // If Cloudinary configured in production
    if (
      env.CLOUDINARY_CLOUD_NAME &&
      env.CLOUDINARY_CLOUD_NAME !== 'demo' &&
      env.CLOUDINARY_API_KEY &&
      env.CLOUDINARY_API_KEY !== 'demo'
    ) {
      // Direct Cloudinary upload
      const cloudinary = (await import('cloudinary')).v2;
      cloudinary.config({
        cloud_name: env.CLOUDINARY_CLOUD_NAME,
        api_key: env.CLOUDINARY_API_KEY,
        api_secret: env.CLOUDINARY_API_SECRET,
      });

      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'haven_reports', resource_type: 'image' },
          (error, result) => {
            if (error) return reject(new ApiError(500, 'UPLOAD_FAILED', error.message));
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          }
        );
        uploadStream.end(processedBuffer);
      });
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
