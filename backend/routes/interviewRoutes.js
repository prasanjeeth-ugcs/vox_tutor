import { Router } from 'express';
import { createInterview, getInterview, getUserInterviews, getUserFeedbacks } from '../controllers/interviewController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', createInterview);
router.get('/', requireAuth, getUserInterviews);
router.get('/:id', getInterview);

export default router;
