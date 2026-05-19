import Credential from '../Models/Credential.js';
import Client from '../Models/Client.js';
import mongoose from 'mongoose';

// Add credentials to a client
export const addClientCredentials = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { credentialName, fields } = req.body;
    const adminId = req.adminId || req.user?._id;

    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID'
      });
    }

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Admin ID is required'
      });
    }

    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    if (!credentialName || !fields || !fields.length) {
      return res.status(400).json({
        success: false,
        message: 'Credential name and at least one field are required'
      });
    }

    const existingCredential = await Credential.findOne({ credentialName });
    if (existingCredential) {
      return res.status(400).json({
        success: false,
        message: `Credential with name "${credentialName}" already exists`
      });
    }

    const newCredential = new Credential({
      clientId,
      credentialName,
      fields,
      createdBy: adminId
    });

    await newCredential.save();

    res.status(201).json({
      success: true,
      message: 'Credentials added successfully',
      credential: newCredential
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get all credentials for a client
export const getClientCredentials = async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID'
      });
    }

    const credentials = await Credential.find({ 
      clientId, 
      isActive: true 
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: credentials.length,
      credentials
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get credential by name
export const getCredentialByName = async (req, res) => {
  try {
    const { clientId, credentialName } = req.params;

    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID'
      });
    }

    const credential = await Credential.findOne({
      clientId,
      credentialName,
      isActive: true
    });

    if (!credential) {
      return res.status(404).json({
        success: false,
        message: `Credential "${credentialName}" not found`
      });
    }

    res.status(200).json({
      success: true,
      credential
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get credential by ID
export const getCredentialById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credential ID'
      });
    }

    const credential = await Credential.findById(id).populate('clientId', 'name clientNumber');

    if (!credential) {
      return res.status(404).json({
        success: false,
        message: 'Credential not found'
      });
    }

    res.status(200).json({
      success: true,
      credential
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update entire credential
export const updateCredential = async (req, res) => {
  try {
    const { id } = req.params;
    const { credentialName, fields } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credential ID'
      });
    }

    const credential = await Credential.findById(id);
    if (!credential) {
      return res.status(404).json({
        success: false,
        message: 'Credential not found'
      });
    }

    if (credentialName && credentialName !== credential.credentialName) {
      const existingCredential = await Credential.findOne({ credentialName });
      if (existingCredential) {
        return res.status(400).json({
          success: false,
          message: `Credential with name "${credentialName}" already exists`
        });
      }
      credential.credentialName = credentialName;
    }

    if (fields) {
      credential.fields = fields;
    }

    await credential.save();

    res.status(200).json({
      success: true,
      message: 'Credential updated successfully',
      credential
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update specific field in credential
export const updateCredentialField = async (req, res) => {
  try {
    const { id, fieldKey } = req.params;
    const { value } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credential ID'
      });
    }

    if (!value) {
      return res.status(400).json({
        success: false,
        message: 'Field value is required'
      });
    }

    const credential = await Credential.findById(id);
    if (!credential) {
      return res.status(404).json({
        success: false,
        message: 'Credential not found'
      });
    }

    const fieldIndex = credential.fields.findIndex(f => f.key === fieldKey);
    
    if (fieldIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Field "${fieldKey}" not found`
      });
    }

    credential.fields[fieldIndex].value = value;
    await credential.save();

    res.status(200).json({
      success: true,
      message: 'Field updated successfully',
      credential
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Add new field to credential
export const addCredentialField = async (req, res) => {
  try {
    const { id } = req.params;
    const { key, value } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credential ID'
      });
    }

    if (!key || !value) {
      return res.status(400).json({
        success: false,
        message: 'Key and value are required'
      });
    }

    const credential = await Credential.findById(id);
    if (!credential) {
      return res.status(404).json({
        success: false,
        message: 'Credential not found'
      });
    }

    const existingField = credential.fields.find(f => f.key === key);
    if (existingField) {
      return res.status(400).json({
        success: false,
        message: `Field with key "${key}" already exists`
      });
    }

    credential.fields.push({ key, value });
    await credential.save();

    res.status(200).json({
      success: true,
      message: 'Field added successfully',
      credential
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Remove field from credential
export const removeCredentialField = async (req, res) => {
  try {
    const { id, fieldKey } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credential ID'
      });
    }

    const credential = await Credential.findById(id);
    if (!credential) {
      return res.status(404).json({
        success: false,
        message: 'Credential not found'
      });
    }

    const fieldIndex = credential.fields.findIndex(f => f.key === fieldKey);
    
    if (fieldIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Field "${fieldKey}" not found`
      });
    }

    credential.fields.splice(fieldIndex, 1);
    await credential.save();

    res.status(200).json({
      success: true,
      message: 'Field removed successfully',
      credential
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Soft delete credential
export const deleteCredential = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credential ID'
      });
    }

    const credential = await Credential.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!credential) {
      return res.status(404).json({
        success: false,
        message: 'Credential not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Credential deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Permanently delete credential
export const permanentDeleteCredential = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credential ID'
      });
    }

    const credential = await Credential.findByIdAndDelete(id);

    if (!credential) {
      return res.status(404).json({
        success: false,
        message: 'Credential not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Credential permanently deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Restore soft deleted credential
export const restoreCredential = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credential ID'
      });
    }

    const credential = await Credential.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true }
    );

    if (!credential) {
      return res.status(404).json({
        success: false,
        message: 'Credential not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Credential restored successfully',
      credential
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get all credential names for a client
export const getCredentialNames = async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID'
      });
    }

    const credentials = await Credential.find({ 
      clientId, 
      isActive: true 
    }).select('credentialName -_id');

    const names = credentials.map(cred => cred.credentialName);

    res.status(200).json({
      success: true,
      names
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};