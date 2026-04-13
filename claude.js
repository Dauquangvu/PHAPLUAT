// api/claude.js - Vercel Serverless Function

export default async function handler(req, res) {
  // Chỉ cho phép POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const { messages } = req.body;

  // Kiểm tra messages
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: "Bad Request: 'messages' is required and must be a non-empty array.",
    });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 1000,
        messages,
      }),
    });

    const data = await response.json();

    // Debug log
    console.log("[Claude API] Status:", response.status);
    console.log("[Claude API] Response:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "Error from Anthropic API",
        details: data,
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("[Claude API] Internal error:", error.message);
    return res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
}
