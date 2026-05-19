import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  clientNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
    profileImage: {
    type: String,
    default: null
  },
  memberSince: {
    type: Date,
    default: Date.now
  },
  projects: {
    type: String,
    default: '0'
  },
  credentials: {
    type: String,
    default: '0'
  },
  contactAdmin: {
    type: String,
    trim: true,
    lowercase: true
  },
  appName: {
    type: String,
    trim: true
  },
  version: {
    type: String,
    trim: true
  }
}, { timestamps: true });

export default mongoose.model('Client', clientSchema);