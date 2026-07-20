import { Router } from 'express';
import {
  createInterview,
  getInterview,
  getUserInterviews,
} from '../controllers/interviewController.js';
import { requireAuth } from '../middleware/auth.js';

/**
 * Interview Routes — CRUD operations for interview sessions.
 *
 * Routes:
 *   POST /api/interviews      — Creates a new interview (public — called right after login)
 *   GET  /api/interviews      — Returns all interviews for the logged-in user (protected)
 *   GET  /api/interviews/:id  — Returns one specific interview by its ID (public for now)
 *
 * Note: requireAuth middleware verifies the session cookie on protected routes.
 */
const router = Router();

router.post('/',    createInterview);              // Create a new interview
router.get('/',     requireAuth, getUserInterviews); // Get all interviews for current user
router.get('/:id',  getInterview);                 // Get one interview by ID

export default router;
