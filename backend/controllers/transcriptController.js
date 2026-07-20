import Interview from '../models/Interview.js';

/**
 * POST /api/transcript
 * Saves a single message (either from the user or the AI) to the interview's transcript.
 * This is called repeatedly during the live interview.
 */
export async function appendTranscript(req, res) {
  try {
    // 1. Get the interview ID and the new message entry
    const { interviewId, entry } = req.body;

    if (!interviewId || !entry) {
      return res.status(400).json({ error: 'Missing interview ID or transcript entry' });
    }

    // 2. Add the message to the array and update the interview status
    // We use MongoDB's $push to safely add to the array without overwriting other messages
    await Interview.findByIdAndUpdate(interviewId, {
      $push: { transcript: entry },
      $set: { status: 'active' }, // Mark as active since they have started talking
    });

    // 3. Confirm success
    return res.json({ ok: true });
  } catch (err) {
    console.error('Transcript save error:', err);
    return res.status(500).json({ error: 'Failed to save transcript entry' });
  }
}
