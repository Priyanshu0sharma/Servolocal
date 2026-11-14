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

## 4. Strict Safety Guardrails

- **Zero-Secret Exposure**: Never touch, overwrite, or log secrets from `.env` or `.env.local`.
- **Preserve Working Features**: Do not replace the existing tech stack, break working Firebase auth, or delete working payments.
- **Database Safety**: Do not perform destructive database drops or unapproved schema migrations.
- **Evidence-Based Done**: Never mark a task as completed without showing the terminal execution output proving it works.
