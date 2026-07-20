import Interview from '../models/Interview.js';
import Feedback from '../models/Feedback.js';

/**
 * POST /api/interviews
 * Creates a new, blank interview session for the user.
 */
export async function createInterview(req, res) {
  try {
    // 1. Extract the interview configuration from the request
    const { userId, domain, domainLabel, domainIcon, difficulty, duration, questions } = req.body;

    // 2. Create a new document in the database
    const createdInterview = await Interview.create({
      userId,
      domain,
      domainLabel,
      domainIcon,
      difficulty,
      duration,
      questions,
      status: 'pending', // Starts as pending until the user begins speaking
      transcript: [],
    });
    
    // 3. Format the response object (convert _id to id)
    const interview = createdInterview.toJSON();
    interview.id = interview._id.toString();

    // 4. Send the new interview back to the frontend
    return res.json({ interview });
  } catch (err) {
    console.error('Create interview error:', err);
    return res.status(500).json({ error: 'Failed to create interview' });
  }
}

/**
 * GET /api/interviews/:id
 * Retrieves a single interview by its ID.
 */
export async function getInterview(req, res) {
  try {
    // 1. Find the interview in the database using the ID from the URL
    const interview = await Interview.findById(req.params.id).lean();
    
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }
    
    // 2. Format the _id field to id for the frontend
    interview.id = interview._id.toString();
    
    // 3. Send the interview back
    return res.json({ interview });
  } catch (err) {
    console.error('Get interview error:', err);
    return res.status(500).json({ error: 'Failed to fetch interview' });
  }
}

/**
 * GET /api/interviews
 * Retrieves all interviews for the currently logged-in user.
 */
export async function getUserInterviews(req, res) {
  try {
    // 1. Get the authenticated user's ID from the middleware
    const userId = req.user.uid;
    
    // 2. Find their interviews, sort by newest first, and limit to 20
    const interviews = await Interview.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // 3. Format the _id fields
    interviews.forEach(interview => { 
      interview.id = interview._id.toString(); 
    });

    // 4. Send the list back
    return res.json({ interviews });
  } catch (err) {
    console.error('Get user interviews error:', err);
    return res.status(500).json({ error: 'Failed to fetch interviews' });
  }
}

/**
 * GET /api/feedbacks
 * Retrieves all feedback reports for the currently logged-in user.
 */
export async function getUserFeedbacks(req, res) {
  try {
    // 1. Get the authenticated user's ID from the middleware
    const userId = req.user.uid;
    
    // 2. Find their feedback reports, sort by newest first, limit to 20
    const feedbacks = await Feedback.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // 3. Format all MongoDB ObjectIds to strings
    feedbacks.forEach(feedback => {
      feedback.id = feedback._id.toString();
      feedback.interviewId = feedback.interviewId.toString();
    });

    // 4. Send the list back
    return res.json({ feedbacks });
  } catch (err) {
    console.error('Get user feedbacks error:', err);
    return res.status(500).json({ error: 'Failed to fetch feedbacks' });
  }
}
