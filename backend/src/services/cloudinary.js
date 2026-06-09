import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         'Homestead',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 800, crop: 'limit', quality: 'auto' }],
  },
});

export const upload = multer({ storage });

// Separate storage for 360° tour images — no crop/resize (equirectangular must stay intact)
const tourStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'Homestead/tours',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
});
export const uploadTour = multer({ storage: tourStorage });

export default cloudinary;