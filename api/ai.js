// /api/ai.js — Vercel Serverless Function
// Proxies requests to Claude API for comment generation
// Deploy on Vercel: set ANTHROPIC_API_KEY in Environment Variables

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

  const { postContent, style } = req.body || {};

  if (!postContent || !style) {
    return res.status(400).json({ error: 'Missing postContent or style' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  const prompt = `Bạn là chuyên gia viết comment mạng xã hội tiếng Việt.

Nội dung bài viết Facebook:
"${postContent}"

Yêu cầu: ${style}

Hãy viết 1 comment ngắn gọn (tối đa 2-3 câu) phù hợp với bài viết trên.
Chỉ trả về nội dung comment, không cần giải thích hay tiêu đề.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(502).json({ error: 'Claude API error', detail: err });
    }

    const data = await response.json();
    const comment = data.content?.[0]?.text?.trim() || '';

    return res.status(200).json({ comment });
  } catch (error) {
    console.error('AI API error:', error);
    return res.status(500).json({ error: 'Internal server error', detail: error.message });
  }
}
