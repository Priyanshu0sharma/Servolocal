# 🚀 ServoLocal — Hyperlocal + Pan-India Commerce Platform

> Asli local dukano se instant delivery + poore Bharat mein courier — ek hi app se.

---

## 📁 Monorepo Structure

```
ServoLocal/
├── backend/                 → FastAPI Python Server (Render Deploy)
│   ├── app/
│   │   ├── core/            → Config, Security, Geo-Engine
│   │   ├── db/              → Database Models & Connection
│   │   └── main.py          → API Entry Point
│   ├── .env                 → All Secrets (NEVER commit)
│   └── requirements.txt
│
├── customer-web/            → Next.js Customer App (Vercel Deploy)
│   └── src/app/             → Pages, Components, API Client
│
├── partner-web/             → Next.js Seller + Delivery + Admin (Vercel Deploy)
│   └── src/app/             → Seller Hub, Partner Panel, Admin Control
│
├── mobile-apps/             → Flutter Native Wrapper
│   └── servolocal_flutter/  → Android APK Builder (WebView + Native GPS/UPI/FCM)
│
├── render.yaml              → 1-Click Render Backend Deploy
└── .gitignore               → Security-Hardened Ignore Rules
```

---

## 🏃 Local Development

### Backend (FastAPI)
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Customer Web (Next.js)
```bash
cd customer-web
npm install
npm run dev                  # http://localhost:3000
```

### Partner Web (Next.js)
```bash
cd partner-web
npm install
npm run dev --port 3001      # http://localhost:3001
```

### Flutter Mobile
```bash
cd mobile-apps/servolocal_flutter
flutter pub get
flutter run
```

---

## 🌐 Deployment

| Service | Platform | URL |
|---------|----------|-----|
| Backend API | Render | `https://servolocal-api.onrender.com` |
| Customer App | Vercel | `https://servolocal.in` |
| Partner App | Vercel | `https://partner.servolocal.in` |
| Android APK | Flutter Build | Play Store / Direct APK |

---

## 🔒 Security
- All API keys stored in `backend/.env` (git-ignored)
- Firebase Admin SDK credentials embedded in `.env` (no separate JSON)
- `.gitignore` blocks all secret patterns at 3 levels

