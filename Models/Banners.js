import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  }
}, { timestamps: true });

export default mongoose.model('Banner', bannerSchema);