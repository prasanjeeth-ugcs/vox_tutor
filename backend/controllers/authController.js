import { adminAuth } from '../config/firebase.js';
import User from '../models/User.js';

// POST /api/auth/session — Create session cookie from Firebase ID token
export async function createSession(req, res) {
  try {
    const { idToken } = req.body;
    const expiresIn = 60 * 60 * 24 * 7 * 1000; // 7 days
    const sessionCookie = await adminAuth().createSessionCookie(idToken, { expiresIn });

    res.cookie('voxtutor-session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error('Create session error:', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// POST /api/auth/revoke — Clear session cookie
export async function revokeSession(req, res) {
  res.clearCookie('voxtutor-session', { path: '/' });
  return res.json({ ok: true });
}

// GET /api/auth/me — Get current user from session
export async function getCurrentUser(req, res) {
  const session = req.cookies['voxtutor-session'];
  if (!session) {
    return res.json({ user: null });
  }

  try {
    const decoded = await adminAuth().verifySessionCookie(session, true);
    const user = await User.findOne({ uid: decoded.uid }).lean();
    if (!user) {
      return res.json({ user: null });
    }
    return res.json({ user });
  } catch {
    return res.json({ user: null });
  }
}

// POST /api/auth/upsert-user — Create or update user document
export async function upsertUser(req, res) {
  try {
    const { uid, name, email, photoURL } = req.body;

    const user = await User.findOneAndUpdate(
      { uid },
      { uid, name, email, photoURL: photoURL || '' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({ ok: true, user });
  } catch (err) {
    console.error('Upsert user error:', err);
    return res.status(500).json({ error: 'Failed to save user' });
  }
}
