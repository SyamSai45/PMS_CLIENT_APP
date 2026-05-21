import express from 'express';
import {
    clientLogin,
    getClientById,
    updateClientById,
    uploadProfileImage,
    getProfileImage,
    updateProfileImage,
    deleteProfileImage,
    changePassword,
    getMyCredentials
} from '../Controllers/clientController.js';
import { uploadProfileImage as multerUpload } from '../config/multer.js';

const router = express.Router();

// All client routes are public (no authentication required)
router.post('/login', clientLogin);
router.get('/client/:id', getClientById);
router.put('/client/:id', updateClientById);
router.post('/change-password', changePassword);
router.get('/:clientId/credentials', getMyCredentials);

// Profile image routes
router.post('/client/:id/profile-image', multerUpload, uploadProfileImage);
router.get('/client/:id/profile-image', getProfileImage);
router.put('/client/:id/profile-image', multerUpload, updateProfileImage);
router.delete('/client/:id/profile-image', deleteProfileImage);

export default router;