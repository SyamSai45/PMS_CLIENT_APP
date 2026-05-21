import mongoose from 'mongoose';

// Dynamic credential schema - no fixed fields
const credentialSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  
  credentialName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Dynamic credentials data - can store any structure
  credentials: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export default mongoose.model('Credential', credentialSchema);