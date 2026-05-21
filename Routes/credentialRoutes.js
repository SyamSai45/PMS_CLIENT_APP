import express from 'express';
import { protectAdmin } from '../middleware/auth.middleware.js';
import {
  addClientCredentials,
  getClientCredentials,
  updateCredential,
  deleteCredential
} from '../Controllers/CredentialController.js';

const router = express.Router();

// All routes require admin authentication
router.use(protectAdmin);

// Credential routes
router.post('/client/:clientId', addClientCredentials);
router.get('/client/:clientId', getClientCredentials);
router.put('/credential/:id', updateCredential);
router.delete('/credential/:id', deleteCredential);

export default router;