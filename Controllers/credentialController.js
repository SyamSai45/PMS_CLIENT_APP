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

    // Transform response to array format
    const credentialArray = [{
      name: credentialName,
      data: credentials
    }];

    res.status(201).json({
      success: true,
      message: 'Credentials added successfully',
      credential: credentialArray
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

// Get all credentials for a client (returns array format)
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

    // Transform to array format
    const credentialsArray = credentials.map(cred => ({
      name: cred.credentialName,
      data: cred.credentials,
      _id: cred._id,
      createdAt: cred.createdAt,
      updatedAt: cred.updatedAt
    }));

    res.status(200).json({
      success: true,
      count: credentialsArray.length,
      credentials: credentialsArray
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

// Get credential by name (returns array format)
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

    // Transform to array format
    const credentialArray = [{
      name: credential.credentialName,
      data: credential.credentials,
      _id: credential._id,
      createdAt: credential.createdAt,
      updatedAt: credential.updatedAt
    }];

    res.status(200).json({
      success: true,
      credential: credentialArray
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

    // Transform to array format
    const credentialArray = [{
      name: credential.credentialName,
      data: credential.credentials,
      _id: credential._id,
      createdAt: credential.createdAt,
      updatedAt: credential.updatedAt
    }];

    res.status(200).json({
      success: true,
      message: 'Credential updated successfully',
      credential: credentialArray
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

    // Transform to array format grouped by client
    const result = [];
    credentials.forEach(cred => {
      result.push({
        client: {
          id: cred.clientId?._id,
          name: cred.clientId?.name,
          clientNumber: cred.clientId?.clientNumber,
          email: cred.clientId?.email
        },
        credential: {
          name: cred.credentialName,
          data: cred.credentials,
          id: cred._id,
          createdAt: cred.createdAt,
          updatedAt: cred.updatedAt
        }
      });
    });

    res.status(200).json({
      success: true,
      count: result.length,
      credentials: result
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