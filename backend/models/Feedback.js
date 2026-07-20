import mongoose from 'mongoose';

/**
 * Feedback — Stores the AI-generated feedback for one completed interview.
 *
 * Fields:
 *   interviewId  — Reference to the Interview document this feedback belongs to
 *   userId       — Firebase UID of the user (for fast per-user queries)
 *   overallScore — A number from 0-100 rating the candidate's overall performance
 *   verdict      — A hiring decision string: "Strong Hire", "Hire", "Maybe", "No Hire"
 *   summary      — A few sentences summarizing how the interview went
 *   categories   — Breakdown scores per skill area (e.g. Communication, Technical)
 *   strengths    — List of things the candidate did well
 *   improvements — List of areas the candidate should work on
 *   nextSteps    — Actionable recommendations for what to study or practice next
 */

// One skill category score (e.g. { name: "Communication", score: 78, ... })
const categorySchema = new mongoose.Schema({
  name:     { type: String, required: true },
  score:    { type: Number, required: true },
  feedback: { type: String, required: true },
  rating:   { type: String, enum: ['excellent', 'good', 'average', 'poor'], required: true },
}, { _id: false }); // _id: false because these are embedded sub-documents

// The main feedback document
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
