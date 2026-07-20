import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// POST /api/vapi/generate — Generate interview questions via Gemini
export async function generateQuestions(req, res) {
  try {
    const { domain, domainLabel, difficulty, topics, numQuestions } = req.body;

    const difficultyContext = {
      entry: 'a fresh graduate or junior with 0–2 years of experience',
      mid: 'a mid-level professional with 2–5 years of experience',
      senior: 'a senior professional with 5+ years of experience',
    };

    const prompt = `You are an expert ${domainLabel} interviewer at a top firm.
Generate exactly ${numQuestions} high-quality interview questions for ${difficultyContext[difficulty]}.
Domain: ${domainLabel}
Key topics to cover: ${topics.join(', ')}

Requirements:
- Questions should be progressively deeper (start accessible, end challenging)
- Each question should be standalone and clear when spoken aloud
- Mix conceptual, behavioral, and situational questions
- Do NOT number the questions
- Return ONLY a JSON array of strings, no other text

Example format: ["Question one?", "Question two?"]`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = (result.text ?? '').trim();

    // Parse JSON safely
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Invalid response format');
    const questions = JSON.parse(jsonMatch[0]);

    return res.json({ questions });
  } catch (err) {
    console.error('Question generation error:', err);
    return res.status(500).json({ error: 'Failed to generate questions' });
  }
}
