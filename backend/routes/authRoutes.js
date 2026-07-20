import { Router } from 'express';
import {
  createSession,
  revokeSession,
  getCurrentUser,
  upsertUser,
} from '../controllers/authController.js';

/**
 * Auth Routes — Handles user authentication via Firebase session cookies.
 *
 * Routes:
 *   POST /api/auth/session      — Creates a session cookie after Firebase sign-in
 *   POST /api/auth/revoke       — Deletes the session cookie (sign-out)
 *   GET  /api/auth/me           — Returns the current logged-in user
 *   POST /api/auth/upsert-user  — Saves or updates the user's profile in MongoDB
 */
const router = Router();

router.post('/session',     createSession);
router.post('/revoke',      revokeSession);
router.get('/me',           getCurrentUser);
router.post('/upsert-user', upsertUser);

export default router;
