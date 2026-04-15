// /api/posts.js — Vercel Serverless Function
// Fetch public Facebook page posts using App Access Token
// Env vars cần set trên Vercel: FB_APP_ID, FB_APP_SECRET

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { page } = req.query;
  if (!page) return res.status(400).json({ error: 'Missing ?page= parameter' });

  const APP_ID     = process.env.FB_APP_ID;
  const APP_SECRET = process.env.FB_APP_SECRET;

  if (!APP_ID || !APP_SECRET) {
    return res.status(500).json({ error: 'FB_APP_ID or FB_APP_SECRET not configured' });
  }

  try {
    // Bước 1: Lấy App Access Token
    const tokenRes = await fetch(
      `https://graph.facebook.com/oauth/access_token?client_id=${APP_ID}&client_secret=${APP_SECRET}&grant_type=client_credentials`
    );
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return res.status(500).json({ error: 'Cannot get App Access Token', detail: tokenData });
    }

    const accessToken = tokenData.access_token;

    // Bước 2: Resolve page identifier (URL → page ID hoặc username)
    let pageId = page.trim();

    // Xử lý nếu user nhập full URL
    const urlMatch = pageId.match(/facebook\.com\/(?:pages\/[^/]+\/)?([^/?#]+)/);
    if (urlMatch) pageId = urlMatch[1];

    // Bước 3: Lấy page info + posts
    const fields = 'id,name,picture{url},fan_count';
    const postFields = 'id,message,story,full_picture,created_time,likes.summary(true),comments.summary(true),shares,permalink_url';

    const pageRes = await fetch(
      `https://graph.facebook.com/v19.0/${encodeURIComponent(pageId)}?fields=${fields}&access_token=${accessToken}`
    );
    const pageData = await pageRes.json();

    if (pageData.error) {
      return res.status(400).json({
        error: pageData.error.message || 'Page not found or not public',
        code: pageData.error.code,
      });
    }

    const postsRes = await fetch(
      `https://graph.facebook.com/v19.0/${pageData.id}/posts?fields=${postFields}&limit=20&access_token=${accessToken}`
    );
    const postsData = await postsRes.json();

    if (postsData.error) {
      return res.status(400).json({ error: postsData.error.message });
    }

    // Format dữ liệu trả về
    const posts = (postsData.data || []).map(p => ({
      id:          p.id,
      message:     p.message || p.story || '(No text)',
      image:       p.full_picture || null,
      created:     p.created_time,
      likes:       p.likes?.summary?.total_count || 0,
      comments:    p.comments?.summary?.total_count || 0,
      shares:      p.shares?.count || 0,
      url:         p.permalink_url || `https://facebook.com/${p.id}`,
    }));

    return res.status(200).json({
      page: {
        id:       pageData.id,
        name:     pageData.name,
        avatar:   pageData.picture?.data?.url || null,
        fans:     pageData.fan_count || 0,
      },
      posts,
      total: posts.length,
    });

  } catch (err) {
    console.error('posts handler error:', err);
    return res.status(500).json({ error: err.message });
  }
}
