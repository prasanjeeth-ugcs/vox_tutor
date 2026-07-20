import mongoose from 'mongoose';

/**
 * User — Stores basic profile info for each person who signs up.
 *
 * Fields:
 *   uid      — The unique user ID from Firebase (e.g. "abc123xyz")
 *   name     — The user's display name (e.g. "Prasanjeeth")
 *   email    — The user's email address
 *   photoURL — A profile photo URL (e.g. from Google sign-in), can be empty
 *
 * `timestamps: true` automatically adds `createdAt` and `updatedAt` fields.
 */
const userSchema = new mongoose.Schema({
  uid:      { type: String, required: true, unique: true, index: true },
  name:     { type: String, required: true },
  email:    { type: String, required: true },
  photoURL: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
