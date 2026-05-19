import express from 'express';
import {
    clientLogin,
    getClientById,
    updateClientById,
    uploadProfileImage,
    getProfileImage,
    updateProfileImage,
    deleteProfileImage
} from '../Controllers/clientController.js';
import { uploadProfileImage as multerUpload } from '../config/multer.js';
const router = express.Router();

// Client routes
router.post('/login', clientLogin);
router.get('/client/:id', getClientById);
router.put('/client/:id', updateClientById);

// multerUpload handles the file, then the controller saves it to DB
router.post('/:id/profile-image', multerUpload, uploadProfileImage);
router.get('/:id/profile-image', getProfileImage);
router.put('/:id/profile-image', multerUpload, updateProfileImage);
router.delete('/:id/profile-image', deleteProfileImage);

export default router;