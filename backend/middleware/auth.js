import { adminAuth } from '../config/firebase.js';
import User from '../models/User.js';

/**
 * Middleware that verifies the session cookie and attaches user info to req.
 * Use on protected routes.
 */
export async function requireAuth(req, res, next) {
  const session = req.cookies['voxtutor-session'];
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const decoded = await adminAuth().verifySessionCookie(session, true);
    const user = await User.findOne({ uid: decoded.uid }).lean();
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid session' });
  }
}
