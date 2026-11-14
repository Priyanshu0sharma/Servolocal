# Servolocal — Master Testing Strategy & Quality Assurance Matrix

> **Document Version**: 2.0.0  
> **Classification**: Quality Assurance, Verification & Automated Testing Matrix  
> **Engineering Methodology**: Obra Superpowers TDD + Codex Agents Verification  
> **Target Environment**: Windows + Antigravity IDE Development Factory  

---

## 1. Quality Assurance Philosophy & Testing Pyramid

Servolocal mandates an **evidence-based verification standard**: no feature or bugfix is marked complete without terminal execution output proving passing status.

```
                   ▲
                  / \
                 / E2E \             Playwright End-to-End User Journeys
                /-------\
               /  Integ  \          FastAPI Endpoint & DB Integration Tests
              /-----------\
             /  Unit Tests \        Pydantic Schemas, Tax Calculators, Hooks
            /---------------\
           / Static & Security \    TypeScript Types, Semgrep SAST, Gitleaks
          └─────────────────────┘
```

---

## 2. Test Execution Command Suite

| Layer | Target System | Command | Execution Frequency |
| :--- | :--- | :--- | :--- |
| **Backend Tests** | FastAPI API & DB Models | `pytest backend/tests` | Every API, schema, or route change |
| **Customer Web Types** | Next.js 15 App | `npm --prefix customer-web run type-check` | Every frontend modification |
| **Customer Web Build** | Next.js 15 Bundle | `npm --prefix customer-web run build` | Prior to PR or user delivery |
| **Partner Web Types** | Next.js 14 App | `npm --prefix partner-web run type-check` | Every merchant app modification |
| **Partner Web Build** | Next.js 14 Bundle | `npm --prefix partner-web run build` | Prior to PR or user delivery |
| **SAST Security Scan** | Python Backend | `semgrep scan --config "p/python" backend/app --metrics=off` | Every auth, DB, or API change |
| **Secret Leak Audit** | Full Repository | `C:\Users\Priyanshuu\.gemini\bin\gitleaks.exe detect --source . --no-git` | Before every git commit |
| **E2E User Journeys** | Web Apps | `npx playwright test` | Milestone validation |

---

## 3. Backend Test Suite Architecture (`backend/tests`)

Built with `pytest`, `pytest-asyncio`, and `httpx.AsyncClient` against isolated test database sessions:

### 3.1 Existing Test Coverage (25 Passing Suites)
1. `test_auth_endpoints`: Phone OTP request, validation, JWT token issuance, session refresh, bad signature rejection.
2. `test_store_endpoints`: Store creation, geofence radius queries, store duty toggle (`is_open`), slug resolution.
3. `test_product_endpoints`: Category listings, stock quantity updates, out-of-stock visibility filtering.
4. `test_order_endpoints`: Order creation, single-store cart validation, pricing breakdown calculation, 5-stage status state machine transitions.
5. `test_payment_endpoints`: Razorpay order creation payload, HMAC-SHA256 signature verification, webhook validation.

---

## 4. Frontend Testing & Type-Safety Matrix

### 4.1 TypeScript Compiler Verification
Both `customer-web` and `partner-web` enforce zero-warning strict TypeScript type checks:
- Customer Web: `tsconfig.json` with strict mode, Next.js type definitions, and path aliases (`@/*`).
- Partner Web: `tsc --noEmit` verifies merchant state, order dispatch models, and settlement figures.

### 4.2 End-to-End User Journey Tests (Playwright)
Scaffolded under `tests/e2e/`:
- **Scenario E2E-01 (Customer Order Flow)**:
  1. Customer visits `/` and selects "Arya College Rd" address.
  2. Customer browses Kirana store, adds "Milk" and "Bread" to cart.
  3. Customer opens cart drawer, verifies delivery fee calculation.
  4. Customer proceeds to checkout, selects Razorpay mock payment, and completes order.
  5. Customer is redirected to live order tracker with 4-digit delivery PIN.
- **Scenario E2E-02 (Partner Order Dispatch Flow)**:
  1. Merchant logs into `partner-web`.
  2. Merchant receives incoming order alert with audio chime.
  3. Merchant marks order as `PACKED` and assigns delivery partner.
  4. Order status updates in real-time on customer web.

---

## 5. Accessibility & Performance Benchmarks

### 5.1 Accessibility (WCAG 2.1 AA)
- Headings follow strict hierarchical order (`h1` ➔ `h2` ➔ `h3`).
- Interactive elements (buttons, links, drawer triggers) feature explicit `aria-label` tags.
- Color contrast ratios exceed 4.5:1 for standard text and 3:1 for large text.
- Keyboard navigation (Tab, Enter, Escape) traps focus properly inside modals.

### 5.2 Performance & Core Web Vitals (CWV)
- **Largest Contentful Paint (LCP)**: ≤ 2.2 seconds.
- **First Input Delay (FID) / INP**: ≤ 100 milliseconds.
- **Cumulative Layout Shift (CLS)**: ≤ 0.05.
- Next.js images optimized with responsive `sizes` attributes and WebP conversion.
