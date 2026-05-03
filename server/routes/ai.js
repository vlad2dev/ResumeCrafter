const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');

const PROMPTS = {
  profile_summary: (content) =>
    `You are a professional resume editor. Be concise. Improve this professional summary for a resume. Make it impactful, first-person, 2-4 sentences. Return only the improved text, no preamble or explanation:\n\n"${content}"`,
  job_responsibility: (content) =>
    `You are a professional resume editor. Improve this resume bullet point. Use a strong action verb, quantify impact where possible, keep under 120 characters. Return only the improved bullet text, no preamble:\n\n"${content}"`,
  job_description: (content) =>
    `You are a professional resume editor. Rewrite this job description as 3-5 strong resume bullet points. Each bullet must start with an action verb. Return only the bullet points, one per line, no preamble:\n\n"${content}"`,
  skill: (content) =>
    `You are a professional resume editor. Suggest 3 related skills to add alongside "${content}" for a tech resume. Return as a comma-separated list only, no explanation.`,
  certification: (content) =>
    `You are a professional resume editor. Suggest how to better present this certification on a resume. Return only the improved description, no preamble:\n\n"${content}"`,
  award: (content) =>
    `You are a professional resume editor. Improve this award description for a resume. Be specific and impactful. Return only the improved text, no preamble:\n\n"${content}"`,
};

// POST /api/ai/review
router.post('/review', async (req, res, next) => {
  try {
    const db = getDb();
    const { context_type, content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Content is required.' });
    }

    const apiKey = db.prepare("SELECT value FROM settings WHERE key='gemini_api_key'").get()?.value;
    if (!apiKey || apiKey.trim() === '') {
      return res.status(400).json({ error: 'Gemini API key not configured. Visit Settings to add your key.' });
    }

    const model = db.prepare("SELECT value FROM settings WHERE key='gemini_model'").get()?.value
                 || 'gemini-2.5-flash';

    const promptFn = PROMPTS[context_type] || ((c) => `Improve this resume text:\n\n"${c}"`);
    const prompt = promptFn(content.trim());

    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 512, temperature: 0.7 }
    });

    // Retry once on 429 rate-limit after the server-suggested delay
    let response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }
    );

    if (response.status === 429) {
      const errBody = await response.json().catch(() => ({}));
      const retryMs = parseRetryDelay(errBody) || 15000;
      await new Promise(r => setTimeout(r, retryMs));
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }
      );
    }

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: errBody.error?.message || `Gemini API error (${response.status})`
      });
    }

    const data = await response.json();
    const suggestion = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    res.json({ suggestion });
  } catch (err) { next(err); }
});

// Parse "retry in Xs" from Gemini 429 error body
function parseRetryDelay(errBody) {
  try {
    const msg = errBody?.error?.message || '';
    const match = msg.match(/retry in ([\d.]+)s/i);
    if (match) return Math.ceil(parseFloat(match[1]) * 1000) + 500;
  } catch {}
  return null;
}

module.exports = router;
