import Interview from '../models/Interview.js';

// POST /api/transcript — Append a transcript entry to an interview
export async function appendTranscript(req, res) {
  try {
    const { interviewId, entry } = req.body;

    if (!interviewId || !entry) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    // Atomically push entry to transcript array and set status to active
    await Interview.findByIdAndUpdate(interviewId, {
      $push: { transcript: entry },
      $set: { status: 'active' },
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error('Transcript save error:', err);
    return res.status(500).json({ error: 'Failed to save' });
  }
}
