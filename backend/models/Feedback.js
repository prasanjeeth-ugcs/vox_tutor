import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name:     { type: String, required: true },
  score:    { type: Number, required: true },
  feedback: { type: String, required: true },
  rating:   { type: String, enum: ['excellent', 'good', 'average', 'poor'], required: true },
}, { _id: false });

const feedbackSchema = new mongoose.Schema({
  interviewId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Interview', required: true, index: true },
  userId:       { type: String, required: true, index: true },
  overallScore: { type: Number, required: true },
  verdict:      { type: String, required: true },
  summary:      { type: String, required: true },
  categories:   [categorySchema],
  strengths:    [{ type: String }],
  improvements: [{ type: String }],
  nextSteps:    [{ type: String }],
}, { timestamps: true });

export default mongoose.model('Feedback', feedbackSchema);
