import { Router } from 'express';
import { appendTranscript } from '../controllers/transcriptController.js';

/**
 * Transcript Routes — Handles saving spoken interview lines in real-time.
 *
 * Routes:
 *   POST /api/transcript — Appends a single transcript entry (one spoken line)
 *                          to the ongoing interview's transcript array in the DB.
 *
 * This is called by the frontend every time the AI or user speaks a complete sentence.
 * Saving line-by-line ensures we don't lose the transcript if the session drops.
 */
const router = Router();

router.post('/', appendTranscript); // Append one spoken line to the interview transcript

export default router;
