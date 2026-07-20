import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  uid:       { type: String, required: true, unique: true, index: true },
  name:      { type: String, required: true },
  email:     { type: String, required: true },
  photoURL:  { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
