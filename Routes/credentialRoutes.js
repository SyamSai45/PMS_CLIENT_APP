import express from 'express';
import {
  addClientCredentials,
  getClientCredentials,
  getCredentialByName,
  getCredentialById,
  updateCredential,
  updateCredentialField,
  addCredentialField,
  removeCredentialField,
  deleteCredential,
  permanentDeleteCredential,
  restoreCredential,
  getCredentialNames
} from '../Controllers/credentialController.js';

const router = express.Router();

// Credential routes
router.post('/client/:clientId/credentials', addClientCredentials);
router.get('/client/:clientId/credentials', getClientCredentials);
router.get('/client/:clientId/credentials/names', getCredentialNames);
router.get('/client/:clientId/credentials/:credentialName', getCredentialByName);
router.get('/credentials/:id', getCredentialById);
router.put('/credentials/:id', updateCredential);
router.put('/credentials/:id/field/:fieldKey', updateCredentialField);
router.post('/credentials/:id/field', addCredentialField);
router.delete('/credentials/:id/field/:fieldKey', removeCredentialField);
router.delete('/credentials/:id', deleteCredential);
router.delete('/credentials/:id/permanent', permanentDeleteCredential);
router.post('/credentials/:id/restore', restoreCredential);

export default router;