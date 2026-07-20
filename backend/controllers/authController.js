import { adminAuth } from '../config/firebase.js';
import User from '../models/User.js';

/**
 * POST /api/auth/session
 * Logs a user in by exchanging their Firebase ID token for a secure session cookie.
 */
export async function createSession(req, res) {
  try {
    // 1. Get the temporary ID token sent from the frontend login
    const { idToken } = req.body;
    
    // 2. Set the cookie to expire in 7 days
    const expiresIn = 60 * 60 * 24 * 7 * 1000; 
    
    // 3. Ask Firebase Admin to create a secure session cookie
    const sessionCookie = await adminAuth().createSessionCookie(idToken, { expiresIn });

    // 4. Attach the cookie to the HTTP response
    res.cookie('voxtutor-session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true, // Prevents JavaScript from reading the cookie (security)
      secure: process.env.NODE_ENV === 'production', // Only over HTTPS in prod
      sameSite: 'lax',
      path: '/',
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error('Create session error:', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * POST /api/auth/revoke
 * Logs a user out by deleting their session cookie.
 */
export async function revokeSession(req, res) {
  // 1. Tell the browser to delete the session cookie
  res.clearCookie('voxtutor-session', { path: '/' });
  return res.json({ ok: true });
}

/**
 * GET /api/auth/me
 * Checks if the user is currently logged in, and returns their profile if they are.
 */
export async function getCurrentUser(req, res) {
  // 1. Check if the browser sent a session cookie
  const session = req.cookies['voxtutor-session'];
  
  if (!session) {
    // No cookie = not logged in
    return res.json({ user: null });
  }

  try {
    // 2. Ask Firebase Admin to verify the cookie is authentic and not expired
    const decoded = await adminAuth().verifySessionCookie(session, true);
    
    // 3. Find the user's profile in our MongoDB database
    const user = await User.findOne({ uid: decoded.uid }).lean();
    
    if (!user) {
      return res.json({ user: null });
    }
    
    // 4. Return the user profile to the frontend
    return res.json({ user });
  } catch {
    // If the cookie is invalid or expired, return null
    return res.json({ user: null });
  }
}

/**
 * POST /api/auth/upsert-user
 * Creates a new user in the database, or updates an existing user's profile picture/name.
 */
export async function upsertUser(req, res) {
  try {
    // 1. Extract the user details from the request
    const { uid, name, email, photoURL } = req.body;

    // 2. Find by 'uid', update if exists, insert if new (upsert)
    const user = await User.findOneAndUpdate(
      { uid: uid }, // Find condition
      { uid, name, email, photoURL: photoURL || '' }, // Data to update
      { upsert: true, new: true, setDefaultsOnInsert: true } // Options
    );

    return res.json({ ok: true, user });
  } catch (err) {
    console.error('Upsert user error:', err);
    return res.status(500).json({ error: 'Failed to save user' });
  }
}
