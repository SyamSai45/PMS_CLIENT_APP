import jwt from 'jsonwebtoken';
import Admin from '../Models/Admin.js';
import Client from '../Models/Client.js';
import Credential from '../Models/Credential.js';
import Banner from '../Models/Banners.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';


// Admin Login
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const defaultAdmin = Admin.getDefaultAdmin();

    if (email === defaultAdmin.email && password === defaultAdmin.password) {
      let existingAdmin = await Admin.findOne({ email: defaultAdmin.email });
      
      if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash(defaultAdmin.password, 10);
        existingAdmin = new Admin({
          email: defaultAdmin.email,
          password: hashedPassword
        });
        await existingAdmin.save();
      }

      const token = jwt.sign(
        { 
          id: existingAdmin._id, 
          email: existingAdmin.email,
          role: 'admin'
        },
        process.env.JWT_SECRET || 'your_secret_key',
        { expiresIn: '30d' }
      );

      return res.status(200).json({
        success: true,
        message: 'Admin login successful',
        admin: { 
          _id: existingAdmin._id,
          email: existingAdmin.email 
        },
        token
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

// Helper function to transform credentials to object format
const transformCredentialsToObject = (credentialsArray) => {
  const credentialsObject = {};
  
  credentialsArray.forEach(cred => {
    credentialsObject[cred.credentialName] = cred.credentials;
  });
  
  return credentialsObject;
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

// Get All Clients with their credentials (array format)
export const getAllClients = async (req, res) => {
  try {
    // Get all clients without password
    const clients = await Client.find({}).select('-password');
    
    // Get all active credentials
    const allCredentials = await Credential.find({ isActive: true });
    
    // Group credentials by clientId
    const credentialsByClient = {};
    allCredentials.forEach(cred => {
      const clientId = cred.clientId.toString();
      if (!credentialsByClient[clientId]) {
        credentialsByClient[clientId] = [];
      }
      credentialsByClient[clientId].push({
        name: cred.credentialName,
        data: cred.credentials,
        _id: cred._id,
        createdAt: cred.createdAt,
        updatedAt: cred.updatedAt
      });
    });
    
    // Combine clients with their credentials in array format
    const clientsWithCredentials = clients.map(client => {
      const clientObj = client.toObject();
      const clientCredentials = credentialsByClient[client._id.toString()] || [];
      
      return {
        ...clientObj,
        credentials: clientCredentials,  // Now it's an array of objects
        credentialsCount: clientCredentials.length
      };
    });
    
    res.status(200).json({
      success: true,
      count: clientsWithCredentials.length,
      clients: clientsWithCredentials
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

// Get Client By ID with credentials count only
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

    const credentialsCount = await Credential.countDocuments({ 
      clientId: id, 
      isActive: true 
    });

    res.status(200).json({
      success: true,
      client: {
        ...client.toObject(),
        credentialsCount: credentialsCount
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


// Update Client By ID with credential management
export const updateClientById = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      // Client fields
      name, email, phone, password, projects, appName, version, contactAdmin,
      // Credential operations
      addCredentials,      // Array of new credentials to add
      updateCredentials,   // Array of existing credentials to update
      deleteCredentialNames  // Array of credential names to delete
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID'
      });
    }

    // Prepare client update data
    const clientUpdates = {};
    if (name) clientUpdates.name = name;
    if (email) clientUpdates.email = email;
    if (phone) clientUpdates.phone = phone;
    if (projects) clientUpdates.projects = projects;
    if (appName) clientUpdates.appName = appName;
    if (version) clientUpdates.version = version;
    if (contactAdmin) clientUpdates.contactAdmin = contactAdmin;
    
    if (password) {
      clientUpdates.password = await bcrypt.hash(password, 10);
    }

    // Update client
    const client = await Client.findByIdAndUpdate(
      id,
      clientUpdates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // 1. ADD new credentials
    if (addCredentials && addCredentials.length > 0) {
      for (const cred of addCredentials) {
        const { credentialName, credentials } = cred;
        
        // Check if credential with same name exists
        const existingCred = await Credential.findOne({ 
          clientId: id, 
          credentialName 
        });
        
        if (!existingCred && credentialName && credentials) {
          await Credential.create({
            clientId: id,
            credentialName,
            credentials,
            createdBy: req.adminId
          });
        }
      }
    }

    // 2. UPDATE existing credentials
    if (updateCredentials && updateCredentials.length > 0) {
      for (const cred of updateCredentials) {
        const { credentialName, credentials } = cred;
        
        await Credential.findOneAndUpdate(
          { clientId: id, credentialName },
          { credentials },
          { new: true }
        );
      }
    }

    // 3. DELETE credentials by name (soft delete)
    if (deleteCredentialNames && deleteCredentialNames.length > 0) {
      for (const credentialName of deleteCredentialNames) {
        await Credential.findOneAndUpdate(
          { clientId: id, credentialName },
          { isActive: false }
        );
      }
    }

    // Get updated credentials list
    const updatedCredentials = await Credential.find({ 
      clientId: id, 
      isActive: true 
    });

    // Transform to object format
    const credentialsObject = {};
    updatedCredentials.forEach(cred => {
      credentialsObject[cred.credentialName] = cred.credentials;
    });

    // Update client's credential count
    await Client.findByIdAndUpdate(id, {
      credentials: updatedCredentials.length.toString()
    });

    res.status(200).json({
      success: true,
      message: 'Client and credentials updated successfully',
      client: {
        ...client.toObject(),
        credentials: credentialsObject,
        credentialsCount: updatedCredentials.length
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

    // Soft delete all credentials for this client
    await Credential.updateMany(
      { clientId: id },
      { isActive: false }
    );

    res.status(200).json({
      success: true,
      message: 'Client and associated credentials deleted successfully'
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

// Create Banner with Image Upload
export const createBanner = async (req, res) => {
  try {
    const adminId = req.adminId;

    if (!adminId) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Admin authentication required'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image file is required'
      });
    }

    // Build image URL
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const imageUrl = `${baseUrl}/${req.file.path.replace(/\\/g, '/')}`;

    const newBanner = new Banner({
      image: imageUrl,
      createdBy: adminId
    });

    await newBanner.save();

    res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      banner: newBanner
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get All Banners (Admin)
export const getAllBanners = async (req, res) => {
  try {
    const { isActive } = req.query;
    
    let query = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    const banners = await Banner.find(query)
      .populate('createdBy', 'email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: banners.length,
      banners
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

// Get Active Banners (Public)
export const getActiveBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: banners.length,
      banners
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

// Get Banner By ID
export const getBannerById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid banner ID'
      });
    }
    
    const banner = await Banner.findById(id)
      .populate('createdBy', 'email');
    
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }
    
    res.status(200).json({
      success: true,
      banner
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

// Update Banner
export const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'Invalid banner ID'
      });
    }
    
    const banner = await Banner.findById(id);
    
    if (!banner) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }
    
    // Update image if new file uploaded
    if (req.file) {
      // Delete old image file
      const oldImagePath = path.join('uploads/banners', path.basename(banner.image));
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
      
      // Build new image URL
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const imageUrl = `${baseUrl}/${req.file.path.replace(/\\/g, '/')}`;
      banner.image = imageUrl;
    }
    
    // Update status
    if (isActive !== undefined) {
      banner.isActive = isActive;
    }
    
    await banner.save();
    
    res.status(200).json({
      success: true,
      message: 'Banner updated successfully',
      banner
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete Banner (Soft Delete)
export const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid banner ID'
      });
    }
    
    const banner = await Banner.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Banner deleted successfully'
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

// Permanently Delete Banner (Also delete file)
export const permanentDeleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid banner ID'
      });
    }
    
    const banner = await Banner.findById(id);
    
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }
    
    // Delete image file from disk
    const imagePath = path.join('uploads/banners', path.basename(banner.image));
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
    
    // Delete banner from database
    await Banner.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: 'Banner permanently deleted successfully'
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

// Restore Banner
export const restoreBanner = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid banner ID'
      });
    }
    
    const banner = await Banner.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true }
    );
    
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Banner restored successfully',
      banner
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