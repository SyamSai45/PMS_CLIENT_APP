import Admin from '../Models/Admin.js';
import Client from '../Models/Client.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

// Admin Login
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const defaultAdmin = Admin.getDefaultAdmin();

    if (email === defaultAdmin.email && password === defaultAdmin.password) {
      const existingAdmin = await Admin.findOne({ email: defaultAdmin.email });
      if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash(defaultAdmin.password, 10);
        const newAdmin = new Admin({
          email: defaultAdmin.email,
          password: hashedPassword
        });
        await newAdmin.save();
      }

      return res.status(200).json({
        success: true,
        message: 'Admin login successful',
        admin: { email: defaultAdmin.email }
      });
    }

    res.status(401).json({
      success: false,
      message: 'Invalid email or password'
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

// Create Client
export const createClient = async (req, res) => {
  try {
    const {
      clientNumber,
      password,
      name,
      email,
      phone,
      memberSince,
      projects,
      credentials,
      contactAdmin,
      appName,
      version
    } = req.body;

    if (!clientNumber || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Client number, password and name are required'
      });
    }

    const existingClient = await Client.findOne({ clientNumber });
    if (existingClient) {
      return res.status(400).json({
        success: false,
        message: 'Client number already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newClient = new Client({
      clientNumber,
      password: hashedPassword,
      name,
      email,
      phone,
      memberSince: memberSince || Date.now(),
      projects: projects || '0',
      credentials: credentials || '0',
      contactAdmin,
      appName,
      version
    });

    await newClient.save();

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      client: {
        _id: newClient._id,
        clientNumber: newClient.clientNumber,
        name: newClient.name,
        email: newClient.email,
        phone: newClient.phone,
        memberSince: newClient.memberSince,
        projects: newClient.projects,
        credentials: newClient.credentials,
        contactAdmin: newClient.contactAdmin,
        appName: newClient.appName,
        version: newClient.version,
        createdAt: newClient.createdAt
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

// Get All Clients
export const getAllClients = async (req, res) => {
  try {
    const clients = await Client.find({}).select('-password');
    res.status(200).json({
      success: true,
      count: clients.length,
      clients
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

// Delete Client By ID
export const deleteClientById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID'
      });
    }

    const client = await Client.findByIdAndDelete(id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Client deleted successfully'
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