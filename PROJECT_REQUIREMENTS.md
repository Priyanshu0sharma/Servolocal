# Servolocal — Project Requirements Document (PRD)

> **Document Version**: 2.0.0  
> **Classification**: Master Product Specification & Requirements Index  
> **Target Environment**: Windows + Antigravity IDE Development Factory  
> **Engineering Methodology**: BMAD-Method & GitHub Spec-Kit Standard  

---

## 1. Executive Summary & Value Proposition

**Servolocal** is a production-grade hyperlocal grocery and local commerce marketplace designed to deliver daily essentials, fresh dairy, bakery goods, street foods, and kirana products to neighborhood households in **10 to 15 minutes**.

Unlike centralized dark-store quick-commerce models that displace neighborhood merchants, Servolocal digitizes and aggregates existing local mom-and-pop stores (kirana shops, local dairies, neighborhood bakeries, and street vendors), providing them with digital storefronts, automated dispatching, and rapid customer settlements.

---

## 2. User Personas & Role-Based Access Control (RBAC)

Servolocal operates an authenticated 4-tier role hierarchy:

```
                  ┌──────────────────────────────────────────┐
                  │          Servolocal User Roles           │
                  └──────────────────────────────────────────┘
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           ▼                            ▼                            ▼
  ┌──────────────────┐        ┌──────────────────┐        ┌──────────────────┐
  │     Customer     │        │  Store Partner   │        │   Rider / Fleet  │
  │ (customer-web)   │        │  (partner-web)   │        │  (partner-web)   │
  └────────┬─────────┘        └────────┬─────────┘        └────────┬─────────┘
           │                           │                           │
           └───────────────────────────┼───────────────────────────┘
                                       ▼
                       ┌───────────────────────────────┐
                       │        Platform Admin         │
                       │          (admin-web)          │
                       └───────────────────────────────┘
```

### 2.1 Customer Persona (`role: customer`)
- **Profile**: Neighborhood resident seeking fast delivery of groceries, milk, vegetables, and snacks.
- **Key Flows**: Phone OTP/Google login, address geo-tagging, live store inventory browsing, cart compilation, instant Razorpay checkout, live order tracking, profile/privacy management.

### 2.2 Store Partner Persona (`role: merchant`)
- **Profile**: Kirana store owner or local food artisan operating a physical shop.
- **Key Flows**: Store KYC verification, inventory catalogue control, stock toggles (in-stock/out-of-stock), live order alert chime, order acceptance, packing confirmation, payout ledger reconciliation.

### 2.3 Delivery Partner Persona (`role: rider`)
- **Profile**: Neighborhood delivery executive fulfilling hyperlocal 1-2 km batches.
- **Key Flows**: Order dispatch notification, store pickup confirmation with 4-digit PIN, GPS transit navigation, customer OTP delivery handoff.

### 2.4 Platform Administrator Persona (`role: admin`)
- **Profile**: Servolocal operational manager.
- **Key Flows**: Store onboarding approvals, commission splits, platform audit logs, refund authorizations, merchant settlement triggers.

---

## 3. Functional Requirements & Feature Matrix

### 3.1 Storefront & Catalogue Browsing
- **REQ-CAT-01**: Hyperlocal location detection (GPS Geolocation API + manual pincode selector with radius fallback of 5 km).
- **REQ-CAT-02**: Real-time catalogue query with store duty status filtering (`is_open = true`).
- **REQ-CAT-03**: Fuzzy search across products, brand names, and vernacular categories (e.g. "bread", "doodh", "maggi").
- **REQ-CAT-04**: Optimistic cart state synchronizing across tab sessions via local storage and server session token.

### 3.2 Multi-Vendor Cart & Checkout State Machine
- **REQ-CHK-01**: Single-store checkout enforcement per batch order (with clear warning on cross-store basket switching).
- **REQ-CHK-02**: Live pricing breakdown: Item Total, Delivery Fee (tiered by distance/basket size), Handling Fee, GST.
- **REQ-CHK-03**: Payment Gateway integration: Razorpay Order Creation -> Client Checkout Modal -> Server-side HMAC-SHA256 signature verification -> Order Status `CONFIRMED`.
- **REQ-CHK-04**: Cash on Delivery (COD) fallback with dynamic phone number validation.

### 3.3 Live Order Lifecycle
- **REQ-ORD-01**: 5-stage deterministic order state transitions:
  `CREATED` ➔ `CONFIRMED` ➔ `PACKING` ➔ `OUT_FOR_DELIVERY` ➔ `DELIVERED` (or `CANCELLED`).
- **REQ-ORD-02**: Merchant auto-decline timeout (3 minutes) triggering automatic refund or alternate store re-routing.
- **REQ-ORD-03**: Secure delivery handoff via dynamic 4-digit delivery PIN generated at order placement.

### 3.4 Account Privacy & Security
- **REQ-PRV-01**: Granular notification opt-outs (WhatsApp order updates, email invoices).
- **REQ-PRV-02**: GDPR / Indian Digital Personal Data Protection (DPDP) Act compliance: Account deletion request workflow with automated 30-day data purging.

---

## 4. Application Completeness Checklist (22 Dimensions)

| Dimension | Scope & Verification Standard | Servolocal Status | Audit Findings & Next Steps |
| :--- | :--- | :--- | :--- |
| **1. Product** | Value proposition, target users, user flows, monetization | **Complete** | Active 10-15m grocery model; commission + delivery fee engine. |
| **2. UX** | Information architecture, loading states, empty states, feedback | **Complete** | Skeleton loaders in place; account tabs aligned to quick-commerce UX. |
| **3. Responsive UI** | Desktop, tablet, mobile layouts, touch targets, dark/light | **Complete** | Mobile-first bottom nav, responsive search bar, drawer modals. |
| **4. Frontend** | Components, state, data fetching, validation, routing, SEO | **Complete** | Next.js 15 App Router, React 19, TypeScript strict type checks passing. |
| **5. Backend** | API design, business logic, background jobs, webhooks | **Complete** | FastAPI async, SQLAlchemy 2.0 async, Pydantic v2 schemas. |
| **6. Database & Migrations** | Schemas, indexes, migrations, pooling, point-in-time recovery | **Complete** | Neon PostgreSQL serverless, Alembic versioned migrations. |
| **7. Authentication** | Signup, login, password reset, session management, OTP | **Complete** | Firebase Auth (Phone/Google) + Neon DB JWT session verification. |
| **8. Authorization** | Roles, permissions, row-level security, tenant isolation | **Complete** | RBAC middleware enforcing merchant inventory isolation. |
| **9. APIs & Integrations** | REST, webhooks, rate limiting, versioning, documentation | **Complete** | FastAPI OpenAPI auto-docs at `/docs`; versioned `/api/v1` routes. |
| **10. File & Image Storage** | Upload, validation, processing, CDN, signed URLs | **In Progress** | Static CDN images live; S3/Cloudinary direct uploads for merchant KYC planned. |
| **11. Payments** | Gateway integration, webhooks, signatures, invoices, refunds | **Complete** | Razorpay checkout + HMAC-SHA256 signature verification. |
| **12. Notifications** | Email, SMS, WhatsApp, push, in-app notification center | **In Progress** | WhatsApp/Email preference controls live; production Resend/Twilio worker pending. |
| **13. Error Handling** | Client errors, API error responses, logging, user feedback | **Complete** | Structured JSON error envelopes, React error boundaries. |
| **14. Logging & Audit** | Application logs, access logs, audit logs, debug tooling | **Complete** | Python `logging` with request IDs; `AGENT_USAGE_LOG.md` active. |
| **15. Security** | OWASP Top 10, sanitization, CSRF, CORS, CSP, secrets | **Complete** | Semgrep SAST 0 findings; Gitleaks zero-secret scan verified. |
| **16. Accessibility** | WCAG 2.1 AA, ARIA attributes, keyboard navigation | **In Progress** | Semantic HTML & ARIA tags present; Playwright axe audit scheduled. |
| **17. Performance** | Bundle size, Core Web Vitals, caching, query optimization | **Complete** | Next.js App Router route segments prerendered; async connection pooling. |
| **18. Automated Tests** | Unit, integration, E2E, visual regression, accessibility | **In Progress** | Backend 25/25 pytest passing; Playwright E2E suite defined. |
| **19. Deployment** | CI/CD, staging, production, zero-downtime, rollbacks | **Complete** | Customer & Partner Web on Vercel; Backend on Render (`render.yaml`). |
| **20. Monitoring & Alerts** | Uptime, error tracking, APM, log aggregation | **In Progress** | Backend `/health` endpoint active; Sentry DSN configuration planned. |
| **21. Documentation** | API docs, architecture diagrams, runbooks, onboarding | **Complete** | Full PRD, Architecture, Roadmap, Testing, and Security specs created. |
| **22. Backup & Recovery** | DB backups, disaster recovery, data export, compliance | **Complete** | Neon PostgreSQL serverless continuous branching & daily backups. |

---

## 5. Non-Functional Requirements (NFRs)

- **Performance**: API p95 response time < 120ms; Customer Web Largest Contentful Paint (LCP) < 2.2s on mobile 4G.
- **Availability**: 99.9% uptime target backed by serverless Neon DB auto-scaling and Vercel Edge CDN.
- **Data Protection**: End-to-end TLS 1.3 encryption, sensitive customer address masking, tokenized payment credentials (zero raw card storage).
