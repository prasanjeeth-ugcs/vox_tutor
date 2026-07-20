import Interview from '../models/Interview.js';
import Feedback from '../models/Feedback.js';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// POST /api/feedback — Generate feedback via Gemini and save to MongoDB
export async function generateFeedback(req, res) {
  try {
    const { interviewId, userId, domainLabel, difficulty, transcript } = req.body;

    const transcriptText = transcript
      .map((t) =>
        `${t.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${t.content}`
      )
      .join('\n\n');

    const prompt = `You are a senior ${domainLabel} hiring manager analyzing a mock interview.
Difficulty level: ${difficulty}

Interview Transcript:
${transcriptText}

Analyze the candidate's performance and return ONLY valid JSON (no markdown, no backticks):
{
  "overallScore": <integer 0-100>,
  "verdict": "<Strong Hire | Hire | Maybe | No Hire>",
  "summary": "<2-3 sentence overall assessment>",
  "categories": [
    {
      "name": "Technical Knowledge",
      "score": <0-100>,
      "feedback": "<specific, constructive feedback referencing actual answers>",
      "rating": "<excellent | good | average | poor>"
    },
    {
      "name": "Communication Clarity",
      "score": <0-100>,
      "feedback": "<specific feedback>",
      "rating": "<excellent | good | average | poor>"
    },
    {
      "name": "Problem-Solving Approach",
      "score": <0-100>,
      "feedback": "<specific feedback>",
      "rating": "<excellent | good | average | poor>"
    },
    {
      "name": "Domain Experience",
      "score": <0-100>,
      "feedback": "<specific feedback>",
      "rating": "<excellent | good | average | poor>"
    }
  ],
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<area 1>", "<area 2>", "<area 3>"],
  "nextSteps": ["<actionable step 1>", "<actionable step 2>", "<actionable step 3>"]
}`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });
    const text = (result.text ?? '').trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid JSON from Gemini');
    const analysis = JSON.parse(jsonMatch[0]);

    // Save feedback to MongoDB
    const feedback = await Feedback.create({
      interviewId,
      userId,
      ...analysis,
    });

    // Update interview status to completed
    await Interview.findByIdAndUpdate(interviewId, {
      status: 'completed',
      completedAt: new Date().toISOString(),
    });

    // Format response for frontend
    const fbObj = feedback.toObject();
    fbObj.id = fbObj._id.toString();
    fbObj.interviewId = fbObj.interviewId.toString();

    return res.json({ feedback: fbObj });
  } catch (err) {
    console.error('Feedback generation error:', err);
    return res.status(500).json({ error: 'Failed to generate feedback' });
  }
}

// GET /api/feedback/:interviewId — Get feedback for an interview
export async function getFeedback(req, res) {
  try {
    const feedback = await Feedback.findOne({ interviewId: req.params.interviewId }).lean();

    if (!feedback) {
      return res.json({ feedback: null });
    }

    feedback.id = feedback._id.toString();
    feedback.interviewId = feedback.interviewId.toString();

    return res.json({ feedback });
  } catch (err) {
    console.error('Get feedback error:', err);
    return res.status(500).json({ error: 'Failed to fetch feedback' });
  }
}
