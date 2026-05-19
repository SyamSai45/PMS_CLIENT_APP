import Client from '../Models/Client.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// Client Login using phoneNumber and password
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
        phone: client.phone
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

// Get Client By ID
export const getClientById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID'
      });
    }

    const client = await Client.findById(id).select('-password');

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    res.status(200).json({
      success: true,
      client
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

// Update Client By ID
export const updateClientById = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID'
      });
    }

    // Remove sensitive fields
    delete updates.clientNumber;

    // Hash password if being updated
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const client = await Client.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Client updated successfully',
      client
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
      profileImage: imageUrl                          // ← full URL now
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
      profileImage: imageUrl                          // ← full URL now
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
      profileImage: imageUrl                          // ← full URL now
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