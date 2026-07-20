import { Router } from 'express';
import { createSession, revokeSession, getCurrentUser, upsertUser } from '../controllers/authController.js';

const router = Router();

router.post('/session', createSession);
router.post('/revoke', revokeSession);
router.get('/me', getCurrentUser);
router.post('/upsert-user', upsertUser);

export default router;
