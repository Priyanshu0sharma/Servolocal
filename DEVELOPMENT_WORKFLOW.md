# Servolocal — Permanent AI Software Development Factory Workflow

> **Document Version**: 1.0.0  
> **Classification**: Permanent Engineering Standard & Lifecycle Protocol  
> **Environment**: Antigravity IDE + Windows 11 + Servolocal Hyperlocal Platform  

---

## 1. Primary Operational Directive

Whenever any engineering, frontend, backend, database, security, or deployment task is requested for Servolocal, all autonomous agents must automatically follow this deterministic 12-step lifecycle without requiring repetitive prompt instructions.

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │                 Permanent 12-Step Development Lifecycle                 │
  └────────────────────────────────────────────────────────────────────────┘
                                      │
   1. UNDERSTAND ➔ 2. INSPECT ➔ 3. IDENTIFY TOOLS ➔ 4. SELECT BEST TOOLS
                                      │
   5. READ DOCS ➔ 6. STEP-BY-STEP PLAN ➔ 7. EXECUTE SLICE ➔ 8. RUN & TEST
                                      │
   9. FIX ERRORS ➔ 10. RETEST FLOW ➔ 11. REVIEW & AUDIT ➔ 12. REPORT EVIDENCE
```

---

## 2. The 12-Step Lifecycle in Detail

### Step 1: Understand the Request
- Parse the user's intent, constraints, and business domain (Customer Web, Partner Web, Rider Fleet, or Backend API).
- Clarify ambiguous specifications using Socratic probing (`grill-me`, `to-spec`) before altering code.

### Step 2: Inspect Current Project & Architecture
- Check [`PROJECT_ARCHITECTURE.md`](file:///c:/Users/Priyanshuu/Desktop/ServoLocal/PROJECT_ARCHITECTURE.md) and [`PROJECT_REQUIREMENTS.md`](file:///c:/Users/Priyanshuu/Desktop/ServoLocal/PROJECT_REQUIREMENTS.md).
- Inspect existing files, schema models, and component hierarchies.
- Never assume an API contract or database field exists without checking source code.

### Step 3: Identify Relevant Installed Tools
- Query the global and workspace toolchain:
  - Plugins: `agent-toolkit`, `agent-workflows`, `codex-agents`, `superpowers`, `modern-web-guidance`.
  - Skills: `impeccable`, `security-audit`, `find-skills`, `spec-driven-development`, `graphify`, `to-spec`, `to-tickets`, etc.
  - CLI Utilities: `semgrep`, `gitleaks`, `repomix`, `playwright`, `pytest`.

### Step 4: Select the Best Tools for the Specific Task
- Dynamically route to domain-specific tools:
  - **UI/UX Work**: Trigger `impeccable` + `modern-web-guidance` + `shadcn/ui` patterns.
  - **Planning/Decomposition**: Trigger `spec-driven-development` + `BMAD-Method` + `GSD` atomic slicing.
  - **Bug Fixes**: Trigger `systematic-debugging` + `root-cause` before proposing code changes.
  - **Security Audits**: Trigger `security-audit` (Cloudflare) + `semgrep` SAST + `gitleaks`.

### Step 5: Read Relevant Documentation Before Execution
- Read the governing `SKILL.md` instructions or official framework guides before applying changes.
- Avoid guessing framework APIs (e.g. Next.js 15 Server Actions, React 19 hooks, FastAPI async sessions).

### Step 6: Create a Step-by-Step Implementation Plan
- Formulate a phased, atomic plan with explicit acceptance criteria.
- Present major architectural modifications to the user before touching code.

### Step 7: Execute the Task (Atomic Implementation)
- Write clean, modular, and idiomatic code adhering to TypeScript strict mode and Python PEP 8.
- **Strict Rule**: Preserve existing working features; do not delete or replace the technology stack.
- **Zero-Secret Rule**: Never touch `.env`, never overwrite credentials, never print API keys or passwords.

### Step 8: Run the Application & Test Actual Implementation
- Execute real runtime verification commands:
  - Customer Web: `npm --prefix customer-web run type-check && npm --prefix customer-web run build`
  - Partner Web: `npm --prefix partner-web run type-check && npm --prefix partner-web run build`
  - Backend: `pytest backend/tests`
  - Playwright E2E: `npx playwright test`

### Step 9: Identify and Fix Errors
- If a build, lint, type check, or test fails, isolate the exact root cause from the error log.
- Fix the bug at the source rather than silencing errors with `@ts-ignore`, `eslint-disable`, or comment bypasses.

### Step 10: Retest the Complete Affected Workflow
- Rerun the test suite to guarantee zero regression across dependent modules.

### Step 11: Perform Code Review, Security Review & Quality Checks
- Run Semgrep SAST: `semgrep scan --config "p/python" backend/app --metrics=off`
- Run Gitleaks secret scan: `C:\Users\Priyanshuu\.gemini\bin\gitleaks.exe protect --staged --verbose`
- Check Core Web Vitals, accessibility tags (ARIA), and mobile responsiveness.

### Step 12: Report Actual Results with Evidence
- Provide transparent terminal evidence of passing tests.
- Record the execution entry in [`AGENT_USAGE_LOG.md`](file:///c:/Users/Priyanshuu/Desktop/ServoLocal/AGENT_USAGE_LOG.md).

---

## 3. Strict Safety Guardrails

1. **Zero Secret Exposure**: Never display, log, or commit `.env` or `.env.local` contents.
2. **Preserve Tech Stack**: Do not replace Next.js 15, FastAPI, Neon DB, Firebase, or Razorpay without explicit written authorization.
3. **Database Integrity**: Never drop tables, truncate collections, or execute destructive raw migrations without approval.
4. **Evidence-Based Done**: Never state that a task is complete without showing actual command outputs proving it works.
5. **Real Functionality**: Never build mock or fake demo functionality when a real working implementation is required.
