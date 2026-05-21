import express from 'express';
import { protectAdmin } from '../middleware/auth.middleware.js';
import {
  adminLogin,
  createClient,
  getAllClients,
  getClientById,
  updateClientById,
  deleteClientById
} from '../Controllers/adminController.js';

const router = express.Router();

router.post('/login', adminLogin);

router.use(protectAdmin);

router.post('/create-client', createClient);
router.get('/clients', getAllClients);
router.get('/client/:id', getClientById);
router.put('/client/:id', updateClientById);
router.delete('/client/:id', deleteClientById);

export default router;