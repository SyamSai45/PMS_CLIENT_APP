import Client from '../Models/Client.js';
import Credential from '../Models/Credential.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// Client Login
export const clientLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and password are required'
      });
    }
    
    const client = await Client.findOne({ phone });
    
    if (!client) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or password'
      });
    }
    
    const isPasswordValid = await bcrypt.compare(password, client.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or password'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Client login successful',
      client: {
        _id: client._id,
        clientNumber: client.clientNumber,
        name: client.name,
        email: client.email,
        phone: client.phone,
        profileImage: client.profileImage,
        memberSince: client.memberSince,
        projects: client.projects,
        credentials: client.credentials,
        appName: client.appName,
        version: client.version
      }
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



// Upload Profile Image
export const uploadProfileImage = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Invalid client ID' });
    }
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }
    
    const client = await Client.findById(id);
    
    if (!client) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    
    // Delete old profile image if exists
    if (client.profileImage) {
      const oldPath = path.join(client.profileImage);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    
    // Save new image path
    client.profileImage = req.file.path.replace(/\\/g, '/');
    await client.save();
    
    // Build full URL
    const imageUrl = `${req.protocol}://${req.get('host')}/${client.profileImage}`;
    
    res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully',
      profileImage: imageUrl
    });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get Profile Image
export const getProfileImage = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid client ID' });
    }
    
    const client = await Client.findById(id).select('profileImage name clientNumber');
    
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    
    if (!client.profileImage) {
      return res.status(404).json({ success: false, message: 'No profile image found for this client' });
    }
    
    // Build full URL
    const imageUrl = `${req.protocol}://${req.get('host')}/${client.profileImage}`;
    
    res.status(200).json({
      success: true,
      clientNumber: client.clientNumber,
      name: client.name,
      profileImage: imageUrl
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update Profile Image
export const updateProfileImage = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Invalid client ID' });
    }
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }
    
    const client = await Client.findById(id);
    
    if (!client) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    
    // Delete old image
    if (client.profileImage) {
      const oldPath = path.join(client.profileImage);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    
    // Save new image
    client.profileImage = req.file.path.replace(/\\/g, '/');
    await client.save();
    
    // Build full URL
    const imageUrl = `${req.protocol}://${req.get('host')}/${client.profileImage}`;
    
    res.status(200).json({
      success: true,
      message: 'Profile image updated successfully',
      profileImage: imageUrl
    });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete Profile Image
export const deleteProfileImage = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID'
      });
    }
    
    const client = await Client.findById(id);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    if (!client.profileImage) {
      return res.status(404).json({
        success: false,
        message: 'No profile image to delete'
      });
    }
    
    // Delete file from disk
    const imagePath = path.join(client.profileImage);
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    
    // Remove from database
    client.profileImage = null;
    await client.save();
    
    res.status(200).json({
      success: true,
      message: 'Profile image deleted successfully'
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

// Change Password
export const changePassword = async (req, res) => {
  try {
    const { id, currentPassword, newPassword } = req.body;
    
    if (!id || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Client ID, current password and new password are required'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID'
      });
    }
    
    const client = await Client.findById(id);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, client.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    client.password = hashedPassword;
    await client.save();
    
    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
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

// Get Client's Credentials in array format
export const getMyCredentials = async (req, res) => {
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