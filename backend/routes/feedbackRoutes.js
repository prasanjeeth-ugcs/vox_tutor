import { Router } from 'express';
import { generateFeedback, getFeedback } from '../controllers/feedbackController.js';
import { getUserFeedbacks } from '../controllers/interviewController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', generateFeedback);
router.get('/user', requireAuth, getUserFeedbacks);
router.get('/:interviewId', getFeedback);

export default router;
