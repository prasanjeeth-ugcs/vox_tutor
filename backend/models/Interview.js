import mongoose from 'mongoose';

const transcriptEntrySchema = new mongoose.Schema({
  role:      { type: String, enum: ['interviewer', 'user'], required: true },
  content:   { type: String, required: true },
  timestamp: { type: String, required: true },
}, { _id: false });

const interviewSchema = new mongoose.Schema({
  userId:      { type: String, required: true, index: true },
  domain:      { type: String, required: true },
  domainLabel: { type: String, required: true },
  domainIcon:  { type: String, required: true },
  difficulty:  { type: String, enum: ['entry', 'mid', 'senior'], required: true },
  duration:    { type: Number, required: true },
  questions:   [{ type: String }],
  status:      { type: String, enum: ['pending', 'active', 'completed'], default: 'pending' },
  transcript:  [transcriptEntrySchema],
  completedAt: { type: String, default: null },
}, { timestamps: true });

export default mongoose.model('Interview', interviewSchema);
