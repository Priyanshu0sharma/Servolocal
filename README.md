# 🚀 ServoLocal — Hyperlocal + Pan-India Commerce Platform

> **Asli local dukano se 15-20 minute instant delivery + poore Bharat mein courier shipping — ek hi platform se.**

---

## 📱 Android APK Direct Download

ServoLocal has **2 distinct production Android apps** compiled automatically in the cloud via GitHub Actions from a unified codebase:

| App | Icon / Flavor | Description | Direct Download Links |
| :--- | :---: | :--- | :--- |
| **ServoLocal Customer App** | 🟢 | **For Customers:** Blinkit/Instamart-style 15–20 Mins Instant Delivery (Kukas/Kunda), distinct variants, liquid free-delivery progress bar, 3-way hybrid checkout, and real-time live bike tracking. | [⬇️ **Download Customer APK**](https://github.com/Priyanshu0sharma/Servolocal/releases/latest/download/ServoLocal-Customer-Release.apk) |
| **ServoPartner Super-App** | 🟣 | **For Sellers, Riders & Admin:** 3-in-1 Business App. Shopkeeper live orders & 2-digit pickup PINs, 54 branded FMCG 1-click catalog, Cloudflare R2 uploads, rider 5-second GPS radar, 60-day ₹2 referral royalty, and Founder Admin Control Room. | [⬇️ **Download Partner APK**](https://github.com/Priyanshu0sharma/Servolocal/releases/latest/download/ServoPartner-Business-Release.apk) |

### 📥 2 Easy Ways to Download the Latest APKs:

#### Method 1: GitHub Releases (1-Click Direct Download)
1. Go to the [**ServoLocal Releases Page**](https://github.com/Priyanshu0sharma/Servolocal/releases).
2. Under **Assets**, click on either:
   - `ServoLocal-Customer-Release.apk` (for Customer App)
   - `ServoPartner-Business-Release.apk` (for Seller / Rider / Admin App)
3. Install the `.apk` on any Android smartphone!

#### Method 2: GitHub Actions Artifacts
1. Go to the [**GitHub Actions Tab**](https://github.com/Priyanshu0sharma/Servolocal/actions/workflows/build-apks.yml).
2. Click on the latest workflow run: **"Build Dual Android APKs"**.
3. Scroll down to the **Artifacts** section at the bottom.
4. Click **`ServoLocal-Dual-APKs`** to download the `.zip` archive containing both release APKs.

---

## 🌐 Live Web & Cloud Deployment

| Service | Platform | Live URL | Description |
| :--- | :--- | :--- | :--- |
| **Customer Web App** | Vercel | [`https://servolocal.in`](https://servolocal.in) | Instant delivery storefront, live cart & tracking |
| **Partner Super-App** | Vercel | [`https://partner.servolocal.in`](https://partner.servolocal.in) | Seller Hub, Delivery Fleet & Admin Control Room |
| **Backend REST API** | Render | [`https://servolocal-api.onrender.com`](https://servolocal-api.onrender.com) | FastAPI + PostgreSQL + Redis + FCM + Razorpay |
| **Cloud Storage** | Cloudflare R2 | S3-Compatible Bucket | Custom product photos & shop banners |

---

## 📁 Monorepo Structure

```
ServoLocal/
├── backend/                             → FastAPI Python Server (Render Deploy)
│   ├── app/
│   │   ├── api/                         → 6 Route Modules (auth, discovery, seller, partner, orders, admin)
│   │   ├── core/                        → Security, Geo-Engine, FCM, Redis Cache, Payment Rails
│   │   ├── db/                          → SQLAlchemy Models, Database Session, 54-item FMCG Seed Catalog
│   │   └── main.py                      → FastAPI App Entry Point
│   ├── .env                             → Environment Secrets (NEVER committed)
│   └── requirements.txt
│
├── customer-web/                        → Next.js 14 Customer Web App (Vercel Deploy)
│   ├── public/logo.jpeg                 → Customer Logo (servolocallogo.jpeg)
│   └── src/
│       ├── app/page.tsx                 → Dynamic 14-Category Grid & Product Rails
│       ├── components/                  → In-Card Photo Swipe Carousel, SmartCart, Live Tracking
│       └── lib/api.ts                   → Complete Axios Client with JWT interceptors
│
├── partner-web/                         → Next.js 14 Partner Super-App (Vercel Deploy)
│   ├── public/logo.jpeg                 → Partner Logo (servolocal_partner_logo.jpeg)
│   └── src/
│       ├── app/page.tsx                 → 3-in-1 Role Switcher (Seller, Rider, Admin)
│       ├── components/                  → SellerDashboard, DeliveryPartnerHub, AdminControlRoom
│       └── lib/api.ts                   → Complete Partner API Client
│
├── mobile-apps/servolocal_flutter/      → Dual-Flavor Flutter Native Android App
│   ├── assets/                          → customer_logo.jpeg & partner_logo.jpeg
│   └── lib/
│       ├── config.dart                  → Compile-Time Flavor Switcher (customer vs partner)
│       ├── native_bridge.dart           → Native GPS Streaming, NPCI UPI Intent, FCM Buzzer
│       └── main.dart                    → Animated Branded Splash & Hardware Bridges
│
├── .github/workflows/
│   └── build-apks.yml                   → Automated Cloud APK Compiler & GitHub Release Publisher
├── render.yaml                          → 1-Click Render Backend Deployment Blueprint
└── .gitignore                           → Security-Hardened Multi-Level Exclusion Rules
```

---

## 🏃 Local Development Quickstart

### 1. Backend (FastAPI)
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # On Windows (or source venv/bin/activate on Linux/Mac)
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Customer Web App
```bash
cd customer-web
npm install
npm run dev                  # Runs on http://localhost:3000
```

### 3. Partner Super-App
```bash
cd partner-web
npm install
npm run dev --port 3001      # Runs on http://localhost:3001
```

### 4. Flutter Mobile App (Manual Local Run)
```bash
cd mobile-apps/servolocal_flutter
flutter pub get

# To run Customer App flavor:
flutter run --dart-define=APP_FLAVOR=customer --dart-define=WEB_URL=http://localhost:3000

# To run Partner App flavor:
flutter run --dart-define=APP_FLAVOR=partner --dart-define=WEB_URL=http://localhost:3001
```

---

## 🔒 Security & Privacy
- All private credentials, database connection strings, and Firebase service accounts reside strictly in `backend/.env` (which is never tracked in Git).
- `.gitignore` strictly guards against accidental credential exposure across all folders.
