# Servolocal — Implementation Roadmap & Execution Plan

> **Document Version**: 2.0.0  
> **Classification**: Master Phased Engineering Roadmap  
> **Engineering Methodology**: BMAD-Method & GSD (Get Shit Done) Atomic Slicing  
> **Target Environment**: Windows + Antigravity IDE Development Factory  

---

## 1. Roadmap Architecture & Execution Principles

All Servolocal development tasks adhere to the strict **GSD & Superpowers** lifecycle:
`ANALYSE` ➔ `PLAN` ➔ `BREAK INTO TASKS` ➔ `IMPLEMENT` ➔ `TEST` ➔ `DEBUG` ➔ `RETEST` ➔ `REVIEW` ➔ `REPORT`

Each phase is divided into verifiable, single-turn executable slices with explicit acceptance criteria.

---

## 2. Phased Development Roadmap

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │                   Servolocal Engineering Phases                        │
  └────────────────────────────────────────────────────────────────────────┘
                                      │
  ┌───────────────────┬───────────────┴───────────────┬───────────────────┐
  ▼                   ▼                               ▼                   ▼
┌───────────────┐   ┌───────────────────────────┐   ┌───────────────────┐ ┌───────────────────┐
│    Phase 1    │   │          Phase 2          │   │      Phase 3      │ │      Phase 4      │
│  Foundation   │   │ Core UX & Quick Commerce  │   │ Dispatch & Fleet  │ │ Scale & Hardening │
│  (COMPLETED)  │   │        (IN PROGRESS)      │   │     (PLANNED)     │ │     (PLANNED)     │
└───────────────┘   └───────────────────────────┘   └───────────────────┘ └───────────────────┘
```

---

### Phase 1: Foundation, Infrastructure & Core Architecture (COMPLETED ✅)
- [x] **TASK-1.1**: FastAPI backend setup with asynchronous SQLAlchemy 2.0 and Pydantic v2 schemas.
- [x] **TASK-1.2**: Serverless Neon PostgreSQL database provisioning with SSL connection pooling.
- [x] **TASK-1.3**: Dual-layer authentication engine (Firebase Phone/Email OTP + Custom JWT session).
- [x] **TASK-1.4**: Customer Web Next.js 15 App Router scaffolding with Tailwind CSS.
- [x] **TASK-1.5**: Partner Web Next.js 14 App Router scaffolding for store owners.
- [x] **TASK-1.6**: Razorpay payment integration with server-side HMAC-SHA256 signature verification.
- [x] **TASK-1.7**: Permanent Antigravity toolkits installation (Superpowers, Agent-Workflows, Agent-Toolkit, Codex-Agents, Modern-Web-Guidance).

---

### Phase 2: Core UX, Quick-Commerce Polish & Privacy (IN PROGRESS 🔄)

#### Task 2.1: Account Privacy & DPDP Compliance (Active)
- **Objective**: Match Blinkit-grade account privacy experience with data management and account deletion.
- **Tasks**:
  - [x] Replace static toggle view with clean, modern card layout (`Account privacy and policy`).
  - [x] Add Blinkit-style legal policy disclaimer with expandable summary.
  - [ ] Implement interactive "Request to delete account" confirmation dialog with 30-day grace period notice.
  - [ ] Connect delete request to backend `/api/v1/users/me/delete-request` endpoint with audit logging.
- **Verification**: `npm --prefix customer-web run build` + Browser subagent visual inspection.

#### Task 2.2: Live Working App Standard (Notification & Navigation Clean-Up)
- **Objective**: Remove demo-only notification red dot badges and align UI strictly to production-ready status.
- **Tasks**:
  - [ ] Replace fake demo notifications with real transactional order notification center.
  - [ ] Ensure account dropdown tab highlighting dynamically tracks current route (`?tab=orders`, `?tab=privacy`, `?tab=profile`).
  - [ ] Implement sticky bottom navigation bar with active cart counter on mobile viewports.
- **Verification**: Browser subagent verification of desktop and mobile viewports.

#### Task 2.3: Hyperlocal Search & Category Experience
- **Objective**: Sub-second search indexing and smart store inventory filtering.
- **Tasks**:
  - [ ] Debounced search bar with instant product preview popover.
  - [ ] Out-of-stock store visual dimming with "Opens at X AM" badge.
  - [ ] Multi-store cart guard modal (warning user if switching stores empties active cart).
- **Verification**: `npm --prefix customer-web run type-check`.

---

### Phase 3: Partner Dispatching & Fleet Fulfillment (PLANNED 📋)

#### Task 3.1: Partner Web Real-Time Audio & Order Stepper
- **Objective**: Instant merchant alert when a customer completes checkout.
- **Tasks**:
  - [ ] WebSockets / Server-Sent Events (SSE) order stream at `/api/v1/merchants/orders/live`.
  - [ ] Audio notification alert (chime) on incoming order with volume override.
  - [ ] 1-click status transitions: `Accept` ➔ `Mark Packed` ➔ `Handover to Rider`.
- **Verification**: Partner web build & Playwright E2E simulation.

#### Task 3.2: Rider Dispatch & 4-Digit Delivery PIN Verification
- **Objective**: Fraud-free delivery fulfillment.
- **Tasks**:
  - [ ] Secure 4-digit PIN generation upon order transition to `OUT_FOR_DELIVERY`.
  - [ ] Rider PIN prompt with backend verification before transitioning order to `DELIVERED`.
- **Verification**: Pytest backend verification (`test_order_pin_verification`).

---

### Phase 4: Production Scale, Observability & Hardening (PLANNED 📋)

#### Task 4.1: Observability & Error Tracking
- **Tasks**:
  - [ ] Integrate Sentry for full-stack error tracking across `customer-web`, `partner-web`, and FastAPI.
  - [ ] Configure Prometheus `/metrics` endpoint on FastAPI for request latency tracking.
- **Verification**: UptimeRobot health check at `/health`.

#### Task 4.2: Automated Playwright E2E Regression Suite
- **Tasks**:
  - [ ] Full checkout test suite (Login ➔ Add to Cart ➔ Checkout ➔ Razorpay Mock ➔ Order Confirmation).
  - [ ] Accessibility (axe-core) automated scanning for WCAG 2.1 AA compliance.
- **Verification**: `npx playwright test`.

#### Task 4.3: Edge Caching & PWA Offline Shell
- **Tasks**:
  - [ ] Web App Manifest and Service Worker caching for instant offline app loading.
  - [ ] Stale-while-revalidate caching headers on static store catalogue routes.
- **Verification**: Lighthouse performance score > 90.
