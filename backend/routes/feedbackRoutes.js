import { Router } from 'express';
import { generateFeedback, getFeedback } from '../controllers/feedbackController.js';
import { getUserFeedbacks } from '../controllers/interviewController.js';
import { requireAuth } from '../middleware/auth.js';

/**
 * Feedback Routes — Handles generating and retrieving interview feedback.
 *
 * Routes:
 *   POST /api/feedback              — Generates AI feedback for a completed interview
 *   GET  /api/feedback/user         — Returns all feedback for the logged-in user (protected)
 *   GET  /api/feedback/:interviewId — Returns feedback for one specific interview
 *
 * Note: requireAuth verifies the session cookie on protected routes.
 * Note: getUserFeedbacks lives in interviewController because it joins interview + feedback data.
 */
const router = Router();

router.post('/',               generateFeedback);              // Generate feedback for an interview
router.get('/user',            requireAuth, getUserFeedbacks); // Get all feedback for current user
router.get('/:interviewId',    getFeedback);                   // Get feedback for a specific interview

export default router;
