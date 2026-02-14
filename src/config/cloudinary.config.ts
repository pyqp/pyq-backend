import { v2 as cloudinary } from 'cloudinary';
import logger from '../utils/logger';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

// Test connection in non-test environments
if (process.env.NODE_ENV !== 'test') {
  cloudinary.api.ping()
    .then(() => logger.info('Cloudinary connected successfully'))
    .catch((err: any) => logger.warn(`Cloudinary not configured: ${err.message}`));
}

export default cloudinary;