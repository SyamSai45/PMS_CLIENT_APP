import jwt from 'jsonwebtoken';
import Admin from '../Models/Admin.js';
import Client from '../Models/Client.js';

// Protect Admin routes
export const protectAdmin = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
    const admin = await Admin.findById(decoded.id).select('-password');
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, admin not found'
      });
    }
    
    req.adminId = admin._id;
    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token failed'
    });
  }
};

// Protect Client routes
export const protectClient = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
    const client = await Client.findById(decoded.id).select('-password');
    
    if (!client) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, client not found'
      });
    }
    
    req.clientId = client._id;
    req.client = client;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token failed'
    });
  }
};

// Check if client is accessing their own data
export const checkClientOwnership = (req, res, next) => {
  const { id } = req.params;
  
  if (id && id !== req.clientId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You can only access your own data'
    });
  }
  
  next();
};