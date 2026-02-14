import { v2 as cloudinary } from 'cloudinary';
import logger from '../utils/logger';

// Configure on load
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class UploadService {
  static async uploadImage(
    fileBuffer: Buffer,
    folder: string,
    publicId?: string
  ): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
      const options: any = { folder, resource_type: 'image' };
      if (publicId) options.public_id = publicId;

      cloudinary.uploader.upload_stream(options, (error, result) => {
        if (error || !result) return reject(error || new Error('Upload failed'));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }).end(fileBuffer);
    });
  }

  static async uploadAvatar(userId: string, buffer: Buffer): Promise<string> {
    const { url } = await this.uploadImage(buffer, 'avatars', `avatar_${userId}`);
    return url;
  }

  static async uploadQuestionImage(buffer: Buffer, questionId: string): Promise<string> {
    const { url } = await this.uploadImage(buffer, 'questions', `q_${questionId}`);
    return url;
  }

  static async uploadPDF(buffer: Buffer, folder: string, name: string): Promise<string> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder, resource_type: 'raw', public_id: name, format: 'pdf' },
        (error, result) => {
          if (error || !result) return reject(error || new Error('Upload failed'));
          resolve(result.secure_url);
        }
      ).end(buffer);
    });
  }

  static async deleteFile(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err: any) {
      logger.warn(`Cloudinary delete failed [${publicId}]: ${err.message}`);
    }
  }

  static getOptimizedUrl(publicId: string, width = 400, height = 400): string {
    return cloudinary.url(publicId, {
      transformation: [
        { width, height, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });
  }
}

export default UploadService;