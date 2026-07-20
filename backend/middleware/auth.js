import { adminAuth } from '../config/firebase.js';
import User from '../models/User.js';

/**
 * requireAuth — Middleware for protecting routes.
 *
 * How it works:
 *   1. Read the session cookie from the incoming request.
 *   2. Ask Firebase to verify the cookie is valid and not expired.
 *   3. Look up the user in our MongoDB database.
 *   4. Attach the user object to `req.user` so route handlers can use it.
 *   5. If anything fails, send a 401 Unauthorized response.
 */
export async function requireAuth(req, res, next) {
  // Step 1: Get the session cookie
  const sessionCookie = req.cookies['voxtutor-session'];

  // If there's no cookie, the user is not logged in
  if (!sessionCookie) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    // Step 2: Verify the cookie using Firebase Admin SDK
    // The second argument `true` checks if the cookie was recently revoked
    const decodedToken = await adminAuth().verifySessionCookie(sessionCookie, true);

    // Step 3: Find the user in our own database using their Firebase UID
    const user = await User.findOne({ uid: decodedToken.uid }).lean();

    // If the user doesn't exist in our DB (e.g. was deleted), reject the request
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Step 4: Attach user to the request object so route handlers can access it
    req.user = user;

    // Step 5: Continue to the next middleware or route handler
    next();
  } catch {
    // If Firebase throws (expired cookie, invalid token, etc.), reject the request
    return res.status(401).json({ error: 'Invalid session' });
  }
}
