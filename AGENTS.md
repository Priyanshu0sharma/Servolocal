# Servolocal — Agent Engineering Index & Guidelines

Welcome to **Servolocal**. This file acts as the primary operational instruction manual and routing index for all coding agents (Codex, Antigravity, Claude Code, Cursor) working in this workspace.

---

## 1. Project Overview & Architecture

Servolocal is a hyperlocal 10-15 minute grocery & store marketplace connecting neighborhood local stores (kirana, dairy, bakeries, street vendors) with customers.

```
                  ┌──────────────────────────────────────────┐
                  │          Servolocal Architecture         │
                  └──────────────────────────────────────────┘
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           ▼                            ▼                            ▼
  ┌──────────────────┐        ┌──────────────────┐        ┌──────────────────┐
  │   customer-web   │        │   partner-web    │        │  FastAPI Backend │
  │ (Next.js 15 App) │        │ (Next.js 14 App) │        │  (Python async)  │
  │ servolocal.vercel│        │ servopartner.    │        │ servolocal-api.  │
  │                  │        │   vercel.app     │        │  onrender.com    │
  └────────┬─────────┘        └────────┬─────────┘        └────────┬─────────┘
           │                           │                           │
           └───────────────────────────┼───────────────────────────┘
                                       ▼
                       ┌───────────────────────────────┐
                       │   Neon PostgreSQL Database    │
                       │   (Pooled Async SQLAlchemy)   │
                       └───────────────────────────────┘
```

- **Customer Web**: Next.js 15 (React 19), Tailwind CSS, TypeScript, Lucide Icons, Razorpay UPI/Card payments, Vercel edge deployment.
- **Partner Web**: Next.js 14, Tailwind CSS, TypeScript, Merchant inventory management, live order dispatching, Razorpay settlement.
- **Backend**: Python 3.12, FastAPI (async/await), SQLAlchemy 2.0 async, Alembic migrations, Pydantic v2 schemas.
- **Database**: Serverless Neon PostgreSQL with SSL connection pooling.
- **Authentication**: Dual-layer (Firebase phone/email auth + custom JWT bearer session tokens verified against Neon DB).

---

## 2. Installed Engineering Workflows & Skills Routing

This project uses 5 official agent toolkits installed in `~/.gemini/config/plugins` and `~/.agents/skills`:

| Lifecycle Phase | Primary Skills | Source Toolkit | Focus & Usage |
| :--- | :--- | :--- | :--- |
| **1. Analyze & Investigate** | `gather-context`<br>`codebase-investigation`<br>`research-web`<br>`root-cause` | `agent-workflows`<br>`codex-agents`<br>`superpowers` | Read code and logs before proposing changes; trace actual dependencies without assumptions. |
| **2. Plan & Break Down** | `phase-breakdown`<br>`plan-implementation`<br>`writing-plans`<br>`split-plan-tasks` | `agent-workflows`<br>`superpowers`<br>`agent-toolkit` | Break large epics into small, independently verifiable tasks with explicit verification steps. |
| **3. Frontend Modernization** | `modern-web-guidance` | `GoogleChrome` | Modern CSS, CWV optimization, responsive design, accessibility, and native browser APIs. |
| **4. Implement & Test** | `test-driven-development`<br>`execute-plan-tasks`<br>`systematic-debugging` | `superpowers`<br>`agent-toolkit`<br>`codex-agents` | Write tests first where applicable, reproduce bugs with minimal test cases, fix root cause. |
| **5. Verify & Align** | `check-alignment`<br>`validate-commit`<br>`verification-before-completion`<br>`project-verification` | `agent-workflows`<br>`superpowers`<br>`codex-agents` | Run formatters, linters, `npm run type-check`, `npm run build`, and `pytest` before marking done. |
| **6. Review & Handover** | `simplify-diff`<br>`self-review`<br>`review-branch`<br>`prepare-handover` | `agent-workflows`<br>`agent-toolkit` | Audit in-flight diffs for over-engineering, prune dead code, synthesize clear commit summaries. |

---

## 3. Mandatory Verification Commands

Before proposing or completing any feature or bugfix, run and verify the relevant command suites:

1. **Customer Web Verification**:
   ```bash
   npm --prefix customer-web run type-check
   npm --prefix customer-web run build
   ```
2. **Partner Web Verification**:
   ```bash
   npm --prefix partner-web run type-check
   npm --prefix partner-web run build
   ```
3. **Backend Test Suite**:
   ```bash
   pytest backend/tests
   ```

---

## 5. UI & Design Reference Systems

| Toolkit | Reference Source | Application Scope | Operational Rule |
| :--- | :--- | :--- | :--- |
| **shadcn/ui** | `shadcn-ui/ui` | Core component primitives & styling | Accessible, unstyled Radix / Tailwind primitives. Copy specific components only when needed; avoid bloating bundles. |
| **Magic UI** | `magicuidesign/magicui` | Micro-interactions & animations | Subtle cart drawer entrances, checkout badges, and order stepper indicators. **Strict rule**: Never overload the app with unnecessary animations. |
| **Spectrum UI** | `arihantcodes/spectrum-ui` | Modern cards, chips & data displays | Clean status pills (e.g. `PACKED`, `CONFIRMED`), shop tags, and order breakdown views. |
| **shadcn/lint** | `shadcn-ui/lint` | React & Tailwind styling conventions | Enforces clean class ordering and accessible JSX structure. |

---

## 6. Commerce & Marketplace Architecture References

> [!IMPORTANT]
> These are architectural and pattern references, **not** instructions to replace the existing Servolocal tech stack. Never migrate the backend away from FastAPI/Neon DB without explicit approval.

| Reference Repository | Architectural Patterns Borrowed | Servolocal Adaptation |
| :--- | :--- | :--- |
| **MedusaJS** (`medusajs/medusa`) | Multi-vendor cart quoting, line-item adjustments, order state machines, payment sessions. | Inspires the 5-stage order transition lifecycle (`CREATED` ➔ `ACCEPTED` ➔ `PACKING` ➔ `OUT_FOR_DELIVERY` ➔ `DELIVERED`). |
| **Vendure** (`vendurehq/vendure`) | Merchant inventory segregation, channel permissions, tax/fee calculations. | Applied to local merchant inventory isolation and real-time open/closed duty status. |
| **SaaS Boilerplate** (`ixartz/SaaS-Boilerplate`) | Next.js App Router organization, clean layout wrappers, and robust error boundaries. | Ensures clean modular Next.js architecture across `customer-web` and `partner-web`. |
| **Next.js SaaS Starter** (`nextjs/saas-starter`) | Optimistic UI updates, server action patterns, and clean session token propagation. | Informs instant cart counter updates and balance reflection. |

---

## 7. Security & Automated Vulnerability Scanning

| Security Tool | Installation / Setup | Scope & Audit Focus |
| :--- | :--- | :--- |
| **Semgrep** (`semgrep/semgrep`) | Installed (`semgrep 1.185.0`) | Automated SAST scanning for Python FastAPI backend and Next.js React frontend. |
| **Semgrep Rules** (`semgrep-rules`) | `p/python`, `p/security-audit`, `p/owasp-top-ten` | Scans for SQL injection, insecure deserialization, unsafe headers, and broken auth. |
| **Gitleaks** (`gitleaks/gitleaks`) | Installed (`v8.24.0` in `~/.gemini/bin/gitleaks.exe`) | Scans staged diffs and repository files for exposed API keys, DB passwords, and private tokens. |
| **OWASP Cheat Sheet** (`OWASP/CheatSheetSeries`) | Permanent security reference | Guides session security, JWT token handling, password hashing, and input validation. |
| **GitHub CodeQL** (`github/codeql-action`) | CI/CD automation template | Semantic vulnerability and taint tracking for GitHub pull requests. |

---

## 8. Automated Testing & Accessibility Toolkit

| Tool | Target Scope | Execution Method |
| :--- | :--- | :--- |
| **Playwright** (`microsoft/playwright`) | Cross-browser End-to-End user journeys (login, cart, checkout, partner dispatch). | Automated headless browser testing via `npx playwright test`. |
| **a11y-next-app** (`chandansamal/a11y-next-app`) | Accessibility compliance (WCAG 2.1 AA, keyboard navigation, contrast, ARIA tokens). | Audits dialog focus traps, screen-reader labels, and color contrast. |

---

## 9. Full Verification Command Suite

Run the applicable command suite for every meaningful change:

1. **Customer Web**:
   ```bash
   npm --prefix customer-web run type-check
   npm --prefix customer-web run build
   ```
2. **Partner Web**:
   ```bash
   npm --prefix partner-web run type-check
   npm --prefix partner-web run build
   ```
3. **Backend Test Suite**:
   ```bash
   pytest backend/tests
   ```
4. **Security Vulnerability Scan (SAST)**:
   ```bash
   semgrep scan --config "p/python" backend/app --metrics=off
   ```
5. **Secret & Key Leak Detection**:
   ```bash
   C:\Users\Priyanshuu\.gemini\bin\gitleaks.exe detect --source . --no-git
   ```

---

## 10. Strict Safety Guardrails

- **Zero-Secret Exposure**: Never touch, overwrite, or log secrets from `.env` or `.env.local`.
- **Preserve Working Features**: Do not replace the existing tech stack, break working Firebase auth, or delete working payments.
- **Database Safety**: Do not perform destructive database drops or unapproved schema migrations.
- **Evidence-Based Done**: Never mark a task as completed without showing the terminal execution output proving it works.
