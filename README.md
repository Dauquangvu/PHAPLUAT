# FBBoost Pro — Semi-Auto Facebook Interaction Tool

## Cấu trúc project

```
fb-tool/
├── index.html        # Giao diện chính (SaaS UI)
├── script.js         # Logic frontend
├── vercel.json       # Vercel deployment config
└── api/
    └── ai.js         # Serverless API — AI comment generation
```

## Deploy lên Vercel (5 phút)

### 1. Cài Vercel CLI
```bash
npm i -g vercel
```

### 2. Login Vercel
```bash
vercel login
```

### 3. Deploy
```bash
cd fb-tool
vercel --prod
```

### 4. Set Environment Variable
Trong Vercel Dashboard → Project → Settings → Environment Variables:
```
ANTHROPIC_API_KEY = sk-ant-xxxxxxxxxxxx
```

Hoặc qua CLI:
```bash
vercel env add ANTHROPIC_API_KEY
```

### 5. Redeploy sau khi set env
```bash
vercel --prod
```

---

## Chạy local (development)

```bash
npm i -g vercel
vercel dev
```
Mở: http://localhost:3000

---

## Sử dụng

1. **Dashboard** → Nhập link Facebook Page → Fetch Posts
2. **Posts** → Tick checkbox like/comment/share cho từng bài
3. Dùng **AI Generate** để tạo comment tự động theo style
4. Nhấn **RUN** ở góc trên phải
5. Tool sẽ:
   - Mở từng bài trong tab mới
   - Copy comment vào clipboard
   - Delay random 7–20s giữa các bài
6. Bạn thủ công: like/paste comment/share trên Facebook

---

## Lưu ý an toàn

- Tool **KHÔNG** tự động click hay login Facebook
- Tool **KHÔNG** vi phạm ToS Facebook vì không dùng automation
- Mọi thao tác cuối đều do người dùng thực hiện thủ công
- Delay ngẫu nhiên để tránh pattern detection

---

## Tùy chỉnh delay

Vào **Settings** để thay đổi delay min/max (mặc định 7–20 giây).
