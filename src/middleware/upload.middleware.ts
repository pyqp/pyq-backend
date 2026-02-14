import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import ApiError from '../utils/ApiError';

const MB = 1024 * 1024;

// Memory storage — files passed as buffers to Cloudinary
const storage = multer.memoryStorage();

const imageFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError('Only JPEG, PNG, and WebP images are allowed', 400) as any, false);
  }
};

const pdfFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new ApiError('Only PDF files are allowed', 400) as any, false);
  }
};

/** Avatar upload — max 2 MB, images only */
export const uploadAvatar = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 2 * MB },
}).single('avatar');

/** Question image — max 5 MB */
export const uploadQuestionImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * MB },
}).single('image');

/** PDF upload — max 20 MB */
export const uploadPDF = multer({
  storage,
  fileFilter: pdfFilter,
  limits: { fileSize: 20 * MB },
}).single('pdf');

/** Generic image upload */
export const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * MB },
}).single('image');