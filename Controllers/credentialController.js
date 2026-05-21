import Credential from '../Models/Credential.js';
import Client from '../Models/Client.js';
import mongoose from 'mongoose';

// Add credentials to a client (Admin only)
export const addClientCredentials = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { credentialName, credentials } = req.body;
    const adminId = req.adminId;

    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID'
      });
    }

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Admin authentication required'
      });
    }

    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    if (!credentialName || !credentials) {
      return res.status(400).json({
        success: false,
        message: 'Credential name and credentials data are required'
      });
    }

    // Check if credential with same name exists
    const existingCredential = await Credential.findOne({
      clientId,
      credentialName
    });

    if (existingCredential) {
      return res.status(400).json({
        success: false,
        message: `Credential with name "${credentialName}" already exists for this client`
      });
    }

    const newCredential = new Credential({
      clientId,
      credentialName,
      credentials,
      createdBy: adminId
    });

    await newCredential.save();

    // Update client's credential count
    const credentialCount = await Credential.countDocuments({ 
      clientId, 
      isActive: true 
    });
    client.credentials = credentialCount.toString();
    await client.save();

    // Transform response to object format
    const credentialObject = {
      [credentialName]: credentials
    };

    res.status(201).json({
      success: true,
      message: 'Credentials added successfully',
      credential: credentialObject
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

// Get all credentials for a client (returns object format)
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

    // Transform to object format
    const credentialsObject = {};
    credentials.forEach(cred => {
      credentialsObject[cred.credentialName] = cred.credentials;
    });

    res.status(200).json({
      success: true,
      count: credentials.length,
      credentials: credentialsObject
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

// Get credential by name (returns object format)
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

    // Transform to object format
    const credentialObject = {
      [credentialName]: credential.credentials
    };

    res.status(200).json({
      success: true,
      credential: credentialObject
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

// Update credential
export const updateCredential = async (req, res) => {
  try {
    const { id } = req.params;
    const { credentialName, credentials } = req.body;

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

    if (credentialName) {
      credential.credentialName = credentialName;
    }
    if (credentials) {
      credential.credentials = credentials;
    }

    await credential.save();

    // Transform to object format
    const credentialObject = {
      [credential.credentialName]: credential.credentials
    };

    res.status(200).json({
      success: true,
      message: 'Credential updated successfully',
      credential: credentialObject
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

// Delete credential (soft delete)
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

    // Update client's credential count
    const credentialCount = await Credential.countDocuments({ 
      clientId: credential.clientId, 
      isActive: true 
    });
    await Client.findByIdAndUpdate(credential.clientId, {
      credentials: credentialCount.toString()
    });

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

// Get all credentials across all clients (admin only)
export const getAllCredentials = async (req, res) => {
  try {
    const credentials = await Credential.find({ isActive: true })
      .populate('clientId', 'name clientNumber email')
      .sort({ createdAt: -1 });

    // Transform to object format grouped by client
    const credentialsByClient = {};
    credentials.forEach(cred => {
      const clientName = cred.clientId?.name || 'Unknown';
      if (!credentialsByClient[clientName]) {
        credentialsByClient[clientName] = {};
      }
      credentialsByClient[clientName][cred.credentialName] = cred.credentials;
    });

    res.status(200).json({
      success: true,
      count: credentials.length,
      credentials: credentialsByClient
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

// Restore deleted credential
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

    // Update client's credential count
    const credentialCount = await Credential.countDocuments({ 
      clientId: credential.clientId, 
      isActive: true 
    });
    await Client.findByIdAndUpdate(credential.clientId, {
      credentials: credentialCount.toString()
    });

    res.status(200).json({
      success: true,
      message: 'Credential restored successfully'
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