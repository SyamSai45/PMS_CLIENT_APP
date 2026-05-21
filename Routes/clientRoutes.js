import express from 'express';
import {
    clientLogin,
    uploadProfileImage,
    getProfileImage,
    updateProfileImage,
    deleteProfileImage,
    getMyCredentials
} from '../Controllers/clientController.js';
import { uploadProfileImage as multerUpload } from '../config/multer.js';

const router = express.Router();

// All client routes are public (no authentication required)
router.post('/login', clientLogin);
router.get('/:clientId/credentials', getMyCredentials);

// Profile image routes
router.post('/:id/profile-image', multerUpload, uploadProfileImage);
router.get('/:id/profile-image', getProfileImage);
router.put('/:id/profile-image', multerUpload, updateProfileImage);
router.delete('/:id/profile-image', deleteProfileImage);

export default router;