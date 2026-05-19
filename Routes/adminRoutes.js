import express from 'express';
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
router.post('/create-client', createClient);
router.get('/clients', getAllClients);
router.get('/client/:id', getClientById);
router.put('/client/:id', updateClientById);
router.delete('/client/:id', deleteClientById);

export default router;