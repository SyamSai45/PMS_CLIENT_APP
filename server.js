import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import dns from 'dns';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import adminRoutes from './Routes/adminRoutes.js';
import clientRoutes from './Routes/clientRoutes.js';

// Force Google DNS servers (fixes Atlas SRV ECONNREFUSED)
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5104;

// __dirname fix for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create upload directories if not exist
const dirs = ['uploads/profiles'];
dirs.forEach(dir => fs.mkdirSync(dir, { recursive: true }));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/client', clientRoutes);

// Home Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Admin Client Management System' });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});