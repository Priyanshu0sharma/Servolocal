---
trigger: always_on
description: Permanent Servolocal engineering rules and tool routing
---

# Servolocal Permanent Engineering Rules

## 1. Automatic Skill Discovery & Workflow Routing
Before starting or responding to any user task:
- Discover installed skills in `~/.gemini/config/plugins`, `~/.gemini/config/skills`, and `.agents/`.
- Automatically select relevant workflows across the 5 primary toolkits:
  1. `obra/superpowers` (for TDD, systematic debugging, planning, and verification)
  2. `jrobertogarcia/agent-workflows` (for lifecycle phases, context gathering, alignment checks, simplify-diff, and commit validation)
  3. `eai-org/agent-toolkit` (for RPAC task breakdown, artifact hardening, manual test instruction creation, and handover)
  4. `signalharbor27/codex-agents` (for architecture investigation, test design, and codebase auditing)
  5. `GoogleChrome/modern-web-guidance` (for frontend UI, responsive design, accessibility, and Core Web Vitals)
- Read their actual `SKILL.md` instructions before applying them.
- Never fabricate tool or skill usage. Show concrete command execution and evidence.

## 2. Mandatory Engineering Lifecycle
Every task must automatically follow this lifecycle:
`ANALYSE` → `PLAN` → `BREAK INTO TASKS` → `IMPLEMENT` → `TEST` → `DEBUG` → `RETEST` → `REVIEW` → `REPORT`

- For complex tasks or architectural modifications: Produce an audit & roadmap artifact first and obtain user approval before writing code.
- For approved tasks: Execute in small, testable slices.

## 3. Mandatory Verification Standards
Always run and show terminal outputs for:
- Customer Web: `npm --prefix customer-web run type-check` and `npm --prefix customer-web run build`
- Partner Web: `npm --prefix partner-web run type-check` and `npm --prefix partner-web run build`
- Backend: `pytest backend/tests`
- Security SAST (when backend/auth modified): `semgrep scan --config "p/python" backend/app --metrics=off`
- Secret Leak Audit (before commits): `C:\Users\Priyanshuu\.gemini\bin\gitleaks.exe detect --source . --no-git`
Never claim an issue is resolved without verifying the fix with terminal evidence.

## 4. UI, Architecture & Security Reference Guardrails
- **UI Design**: Use `shadcn/ui`, `magicui`, and `spectrum-ui` as design references for accessible components and clean micro-interactions. Never overload the application with unnecessary animations or bloated dependencies.
- **Marketplace Reference**: Use `medusa` and `vendure` patterns for order state machines and multi-vendor inventory isolation. Never replace or migrate Servolocal's FastAPI/Neon DB architecture without explicit approval.
- **Security Standards**: Follow `OWASP CheatSheetSeries` for input validation, JWT handling, and password security. Never print or log `.env` secrets.
- **Automated Testing**: Use `playwright` for end-to-end user journey verification and `a11y-next-app` for accessibility standards.

## 5. Permanent Usage Logging
Maintain `AGENT_USAGE_LOG.md` at the workspace root, logging:
- Task ID and description
- Repositories and skills triggered
- Instruction files accessed
- Commands executed
- Test outcomes and evidence
- Errors encountered and fixes applied
- Changed files
- Final status

## 6. Master Factory Specifications & Token Optimization
- Every task must align with `PROJECT_REQUIREMENTS.md`, `PROJECT_ARCHITECTURE.md`, `IMPLEMENTATION_ROADMAP.md`, `TESTING_STRATEGY.md`, and `SECURITY_CHECKLIST.md`.
- Use `npx repomix` with `repomix.config.json` for token-efficient codebase context serialization.
- Follow BMAD-Method and GSD principles: atomic, single-turn execution slices with explicit acceptance criteria.

