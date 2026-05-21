import express from 'express';
import { protectAdmin } from '../middleware/auth.middleware.js';
import {
  adminLogin,
  createClient,
  getAllClients,
  getClientById,
  updateClientById,
  deleteClientById,
  createBanner,
  getAllBanners,
  getActiveBanners,
  getBannerById,
  updateBanner,
  deleteBanner
} from '../Controllers/adminController.js';
import { uploadBannerImage } from '../config/multer.js';

const router = express.Router();

router.post('/login', adminLogin);
router.get('/client/:id', getClientById);


router.post('/create-client', createClient);
router.get('/clients', getAllClients);
router.put('/client/:id', updateClientById);
router.delete('/client/:id', deleteClientById);

router.post('/banners', protectAdmin, uploadBannerImage, createBanner);
router.get('/banners', getAllBanners);
router.get('/activebanners', getActiveBanners);
router.get('/banners/:id', getBannerById);
router.put('/banners/:id', protectAdmin, uploadBannerImage, updateBanner);
router.delete('/banners/:id', protectAdmin, deleteBanner);

export default router;