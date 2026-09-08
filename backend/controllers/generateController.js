/**
 * POST /api/vapi/generate
 * Generates interview questions using Google's Gemini AI.
 * 
 * Uses direct REST API calls instead of the SDK to support
 * both AIza... and AQ. (service-account-bound) API key formats.
 */
export async function generateQuestions(req, res) {
  try {
    // 1. Extract the interview configuration from the request
    const { domain, domainLabel, difficulty, topics, numQuestions } = req.body;

    // 2. Define exactly what each difficulty level means
    const difficultyContext = {
      entry: 'a fresh graduate or junior with 0–2 years of experience',
      mid: 'a mid-level professional with 2–5 years of experience',
      senior: 'a senior professional with 5+ years of experience',
    };

    // 3. Build the prompt instructions for the AI
    const prompt = `You are an expert ${domainLabel} interviewer at a top firm.
Generate exactly ${numQuestions} high-quality interview questions for ${difficultyContext[difficulty]}.
Domain: ${domainLabel}
Key topics to cover: ${topics.join(', ')}

Requirements:
- Questions should be progressively deeper (start accessible, end challenging)
- Each question should be standalone and clear when spoken aloud
- Mix conceptual, behavioral, and situational questions
- Do NOT number the questions
- Return a JSON array of strings representing the questions.`;

    // 4. Call the Gemini REST API directly (bypasses SDK auth issues with AQ. keys)
    const apiKey = process.env.GEMINI_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Gemini API error:', response.status, errorBody);
      throw new Error(`Gemini API returned ${response.status}`);
    }

    const data = await response.json();

    // 5. Extract the generated text from the API response
    const text = (data.candidates?.[0]?.content?.parts?.[0]?.text ?? '').trim();
    const questions = JSON.parse(text);

    // 6. Send the generated questions back to the frontend
    return res.json({ questions });
    
  } catch (err) {
    console.error('Question generation error:', err);
    return res.status(500).json({ error: 'Failed to generate questions' });
  }
}
