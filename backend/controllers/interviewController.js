import Interview from '../models/Interview.js';
import Feedback from '../models/Feedback.js';

// POST /api/interviews — Create a new interview
export async function createInterview(req, res) {
  try {
    const { userId, domain, domainLabel, domainIcon, difficulty, duration, questions } = req.body;

    const createdInterview = await Interview.create({
      userId,
      domain,
      domainLabel,
      domainIcon,
      difficulty,
      duration,
      questions,
      status: 'pending',
      transcript: [],
    });
    
    const interview = createdInterview.toJSON();
    interview.id = interview._id.toString();

    return res.json({ interview });
  } catch (err) {
    console.error('Create interview error:', err);
    return res.status(500).json({ error: 'Failed to create interview' });
  }
}

// GET /api/interviews/:id — Get single interview
export async function getInterview(req, res) {
  try {
    const interview = await Interview.findById(req.params.id).lean();
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }
    // Map _id to id for frontend consistency
    interview.id = interview._id.toString();
    return res.json({ interview });
  } catch (err) {
    console.error('Get interview error:', err);
    return res.status(500).json({ error: 'Failed to fetch interview' });
  }
}

// GET /api/interviews — Get interviews for current user
export async function getUserInterviews(req, res) {
  try {
    const userId = req.user.uid;
    const interviews = await Interview.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // Map _id to id for frontend consistency
    interviews.forEach(i => { i.id = i._id.toString(); });

    return res.json({ interviews });
  } catch (err) {
    console.error('Get user interviews error:', err);
    return res.status(500).json({ error: 'Failed to fetch interviews' });
  }
}

// GET /api/feedbacks — Get feedbacks for current user
export async function getUserFeedbacks(req, res) {
  try {
    const userId = req.user.uid;
    const feedbacks = await Feedback.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // Map _id to id and interviewId to string
    feedbacks.forEach(f => {
      f.id = f._id.toString();
      f.interviewId = f.interviewId.toString();
    });

    return res.json({ feedbacks });
  } catch (err) {
    console.error('Get user feedbacks error:', err);
    return res.status(500).json({ error: 'Failed to fetch feedbacks' });
  }
}
