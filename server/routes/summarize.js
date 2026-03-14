const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

function getMetadata(sessionId) {
    const metaPath = path.join(__dirname, '../screenshots', sessionId, 'metadata.json');
    if (!fs.existsSync(metaPath)) return null;
    return JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
}

// POST /api/summarize — get key moments + optional AI summary for students
router.post('/summarize', async (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

    const meta = getMetadata(sessionId);
    if (!meta) return res.status(404).json({ error: 'Session not found' });

    const keyMoments = (meta.screenshots || []).map((s) => ({
        time: s.timestampStr,
        seconds: s.timestamp,
        label: `Slide at ${s.timestampStr}`,
    }));

    const payload = {
        title: meta.title || 'Video',
        keyMoments,
        totalSlides: keyMoments.length,
    };

    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
        try {
            const prompt = `You are an expert study assistant. Create a smart, concise summary of this educational video to help students learn quickly.

Video title: ${payload.title}
Key slide timestamps (use these to jump to topics): ${keyMoments.map((m) => m.time).join(', ')}

Write an "AI Smart Summary" that includes:
1. In 1–2 sentences: what this video is about.
2. Main topics or sections (aligned with the timestamps where possible).
3. Key takeaways or concepts a student should remember.
4. Optional: one short study tip (e.g. "Review the slides at 5:00 and 12:30 for the core formulas").

Keep the tone clear and educational. Use bullet points. Maximum 150 words.`;
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 450,
                    temperature: 0.4,
                }),
            });
            const data = await response.json();
            const text = data?.choices?.[0]?.message?.content?.trim();
            if (text) payload.aiSummary = text;
        } catch (err) {
            console.error('OpenAI summarize error:', err.message);
        }
    }

    res.json(payload);
});

module.exports = router;
