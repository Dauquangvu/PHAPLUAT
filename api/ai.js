// /api/ai.js — Vercel Serverless Function
// Dùng biến môi trường: AI_BASE_URL, AI_API_KEY, AI_MODEL

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body || {};

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  // Đọc từ env vars (set trong Vercel Dashboard)
  const API_KEY   = process.env.AI_API_KEY;
  const BASE_URL  = process.env.AI_BASE_URL  || 'https://api.anthropic.com';
  const MODEL     = process.env.AI_MODEL     || 'claude-3-haiku-20240307';

  if (!API_KEY) {
    return res.status(500).json({ error: 'AI_API_KEY not configured' });
  }

  try {
    const endpoint = `${BASE_URL.replace(/\/$/, '')}/v1/messages`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      MODEL,
        max_tokens: 256,
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI API error:', response.status, errText);
      return res.status(response.status).json({
        error: `AI API returned ${response.status}`,
        detail: errText,
      });
    }

    const data = await response.json();

    // Lấy text từ response
    const result =
      data?.content?.[0]?.text ||
      data?.choices?.[0]?.message?.content ||
      '';

    return res.status(200).json({ result });

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: err.message });
  }
}
