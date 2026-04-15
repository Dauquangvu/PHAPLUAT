# FB Interaction Pro

Semi-auto Facebook interaction tool. Deploy on Vercel.

## Env vars (đã set trên Vercel Dashboard)

| Var | Value |
|-----|-------|
| `AI_API_KEY` | sk-ant-api03-... |
| `AI_BASE_URL` | https://1gw.gwai.cloud |
| `AI_MODEL` | claude-3-haiku-20240307 |

## Deploy

```bash
npm i -g vercel
cd fb-tool
vercel --prod
```

## Files

- `index.html` — UI
- `script.js` — Frontend logic
- `api/ai.js` — Serverless AI proxy
- `vercel.json` — Deploy config
