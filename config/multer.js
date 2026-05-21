import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Profile image storage
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = 'uploads/profiles';
    ensureDirectoryExists(folder);
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'profile-' + uniqueSuffix + ext);
  }
});

// Banner image storage
const bannerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = 'uploads/banners';
    ensureDirectoryExists(folder);
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'banner-' + uniqueSuffix + ext);
  }
});

// File filter for images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Profile image upload (single file)
export const uploadProfileImage = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
}).single('profileImage');

// Banner upload - accepts multiple field names
export const uploadBannerImage = (req, res, next) => {
  const upload = multer({
    storage: bannerStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter
  }).any(); // This accepts any field name
  
  upload(req, res, (err) => {
    if (err) {
      return next(err);
    }
    
    // Find the uploaded file regardless of field name
    if (req.files && req.files.length > 0) {
      req.file = req.files[0];
    }
    
    next();
  });
};

// Multiple banner images upload
export const uploadMultipleBannerImages = multer({
  storage: bannerStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
}).array('images', 10);

// Generic upload
export const upload = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});